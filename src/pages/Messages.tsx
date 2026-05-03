import { useState, useEffect, useRef } from "react";
import { Send, Search, Paperclip, Check, CheckCheck, Loader2, UserPlus, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  userId: string;
  userName: string;
  username?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface SearchedUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchConversations();
    }
  }, [user, authLoading, navigate]);

  // Honor ?to=<userId> deep link to start/select a conversation
  useEffect(() => {
    const to = searchParams.get("to");
    if (!to || !user || to === user.id) return;
    (async () => {
      const existing = conversations.find((c) => c.userId === to);
      if (existing) {
        setSelectedUserId(to);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, email, username")
        .eq("id", to)
        .maybeSingle();
      if (prof) {
        setConversations((prev) => [{
          userId: prof.id,
          userName: prof.full_name || prof.email || "User",
          username: prof.username || undefined,
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
        }, ...prev]);
        setSelectedUserId(prof.id);
      }
    })();
  }, [searchParams, user, conversations]);

  useEffect(() => {
    if (selectedUserId && user) {
      fetchMessages(selectedUserId);
      markAsRead(selectedUserId);
    }
  }, [selectedUserId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (selectedUserId === newMessage.sender_id) {
            setMessages((prev) => [...prev, newMessage]);
            markAsRead(newMessage.sender_id);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId]);

  // Search users by username
  useEffect(() => {
    const searchUsers = async () => {
      if (!newChatSearch.trim() || newChatSearch.length < 2 || !user) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .neq("id", user.id)
          .or(`username.ilike.%${newChatSearch}%,full_name.ilike.%${newChatSearch}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [newChatSearch, user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const conversationMap = new Map<string, Message[]>();
      messagesData?.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, []);
        }
        conversationMap.get(partnerId)!.push(msg);
      });

      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, username")
          .in("id", partnerIds);

        const convs: Conversation[] = partnerIds.map((partnerId) => {
          const msgs = conversationMap.get(partnerId) || [];
          const profile = profiles?.find((p) => p.id === partnerId);
          const unreadCount = msgs.filter(
            (m) => m.receiver_id === user.id && !m.is_read
          ).length;

          return {
            userId: partnerId,
            userName: profile?.full_name || profile?.email || "User",
            username: profile?.username || undefined,
            lastMessage: msgs[0]?.content || "",
            lastMessageTime: msgs[0]?.created_at || "",
            unreadCount,
          };
        });

        setConversations(convs);
        if (!selectedUserId && convs.length > 0) {
          setSelectedUserId(convs[0].userId);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", senderId)
        .eq("receiver_id", user.id);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUserId || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedUserId,
        content: messageText.trim(),
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender_id: user.id,
          receiver_id: selectedUserId,
          content: messageText.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);
      setMessageText("");
      fetchConversations();
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = (searchedUser: SearchedUser) => {
    // Check if conversation already exists
    const existing = conversations.find(c => c.userId === searchedUser.id);
    if (existing) {
      setSelectedUserId(searchedUser.id);
    } else {
      // Add temporary conversation entry
      setConversations(prev => [{
        userId: searchedUser.id,
        userName: searchedUser.full_name || searchedUser.username || "User",
        username: searchedUser.username || undefined,
        lastMessage: "",
        lastMessageTime: "",
        unreadCount: 0,
      }, ...prev]);
      setSelectedUserId(searchedUser.id);
    }
    setShowNewChat(false);
    setNewChatSearch("");
    setSearchResults([]);
  };

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedUserId
  );

  // Filter conversations by search
  const filteredConversations = conversations.filter(c =>
    !searchQuery.trim() ||
    c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Messages</h1>

        <Card className="h-[600px]">
          <CardContent className="p-0 h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              {/* Conversations List */}
              <div className="border-r border-border">
                <div className="p-4 border-b space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search conversations..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewChat(!showNewChat)}
                      title="New message"
                    >
                      {showNewChat ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* New Chat Search */}
                  {showNewChat && (
                    <div className="relative">
                      <Input
                        placeholder="Search by username or name..."
                        value={newChatSearch}
                        onChange={(e) => setNewChatSearch(e.target.value)}
                        autoFocus
                      />
                      {(searchResults.length > 0 || isSearching) && (
                        <div className="absolute top-full left-0 right-0 bg-popover border border-border rounded-md shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-3 text-center text-muted-foreground text-sm">
                              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                              Searching...
                            </div>
                          ) : (
                            searchResults.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => startNewConversation(u)}
                                className="w-full p-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {(u.full_name || u.username || "U").substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{u.full_name || "User"}</p>
                                  {u.username && (
                                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                          {!isSearching && searchResults.length === 0 && newChatSearch.length >= 2 && (
                            <div className="p-3 text-center text-muted-foreground text-sm">
                              No users found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="overflow-y-auto h-[calc(600px-73px)]">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <p className="text-muted-foreground mb-2">No conversations yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewChat(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Start a conversation
                      </Button>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.userId}
                        onClick={() => setSelectedUserId(conv.userId)}
                        className={`w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors border-b border-border ${
                          selectedUserId === conv.userId ? "bg-accent" : ""
                        }`}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conv.userName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="font-semibold">{conv.userName}</span>
                              {conv.username && (
                                <span className="text-xs text-muted-foreground ml-1">@{conv.username}</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {conv.lastMessageTime && formatRelativeTime(conv.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                              {conv.lastMessage || "No messages yet"}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className="md:col-span-2 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {selectedConversation.userName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{selectedConversation.userName}</h3>
                        {selectedConversation.username && (
                          <p className="text-xs text-muted-foreground">@{selectedConversation.username}</p>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <p>No messages yet. Say hello!</p>
                        </div>
                      )}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              message.sender_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent"
                            }`}
                          >
                            <p>{message.content}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p
                                className={`text-xs ${
                                  message.sender_id === user?.id
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </p>
                              {message.sender_id === user?.id && (
                                <span className="text-xs ml-2">
                                  {message.is_read ? (
                                    <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                  ) : (
                                    <Check className="h-3 w-3 text-primary-foreground/70" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*,.pdf"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          placeholder="Type your message..."
                          className="flex-1"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              sendMessage();
                            }
                          }}
                        />
                        <Button
                          className="bg-primary hover:bg-primary/90"
                          onClick={sendMessage}
                          disabled={sending || !messageText.trim()}
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <p>Select a conversation or start a new one</p>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewChat(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
};

export default Messages;
