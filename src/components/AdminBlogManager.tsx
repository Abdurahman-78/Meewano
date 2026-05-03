import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAllPostsAdmin, useBlogCategories, useUpsertPost, useDeletePost,
  useUpsertCategory, useDeleteCategory, type BlogPost,
} from "@/hooks/useBlog";
import { logAdminAction } from "@/lib/tracking";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

const emptyPost = (): Partial<BlogPost> => ({
  slug: "", title_en: "", title_ar: "", title_ku: "",
  excerpt_en: "", excerpt_ar: "", excerpt_ku: "",
  content_en: "", content_ar: "", content_ku: "",
  cover_image: "", meta_title: "", meta_description: "",
  status: "draft", category_id: null,
});

const AdminBlogManager = () => {
  const { user } = useAuth();
  const { data: posts, isLoading } = useAllPostsAdmin();
  const { data: categories } = useBlogCategories();
  const upsertPost = useUpsertPost();
  const deletePost = useDeletePost();
  const upsertCategory = useUpsertCategory();
  const deleteCategory = useDeleteCategory();

  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [editingCat, setEditingCat] = useState<{ id?: string; slug: string; name_en: string; name_ar: string; name_ku: string } | null>(null);

  const savePost = async () => {
    if (!editing || !user) return;
    if (!editing.title_en || !editing.content_en) { toast.error("English title and content required"); return; }
    if (!editing.slug) editing.slug = slugify(editing.title_en);
    if (!editing.id) editing.author_id = user.id;
    try {
      const saved = await upsertPost.mutateAsync(editing);
      await logAdminAction(user.id, editing.id ? "blog_post_updated" : "blog_post_created", { entity_type: "blog_post", entity_id: saved.id, details: { title: editing.title_en, status: editing.status } });
      toast.success("Post saved");
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const removePost = async (p: any) => {
    if (!confirm(`Delete "${p.title_en}"?`)) return;
    try {
      await deletePost.mutateAsync(p.id);
      if (user) await logAdminAction(user.id, "blog_post_deleted", { entity_type: "blog_post", entity_id: p.id, details: { title: p.title_en } });
      toast.success("Deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  const saveCategory = async () => {
    if (!editingCat) return;
    if (!editingCat.name_en) { toast.error("Name required"); return; }
    if (!editingCat.slug) editingCat.slug = slugify(editingCat.name_en);
    try {
      await upsertCategory.mutateAsync(editingCat);
      toast.success("Category saved");
      setEditingCat(null);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Blog</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setEditing(emptyPost())}><Plus className="h-4 w-4 mr-2" />New post</Button>
            </div>
            {isLoading ? <p>Loading…</p> : posts && posts.length > 0 ? (
              <div className="space-y-2">
                {posts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge>
                        {p.blog_categories && <Badge variant="outline">{p.blog_categories.name_en}</Badge>}
                      </div>
                      <p className="font-medium truncate">{p.title_en}</p>
                      <p className="text-xs text-muted-foreground">/{p.slug} · {p.view_count ?? 0} views</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => removePost(p)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground text-sm">No posts yet.</p>}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setEditingCat({ slug: "", name_en: "", name_ar: "", name_ku: "" })}>
                <Plus className="h-4 w-4 mr-2" />New category
              </Button>
            </div>
            {categories?.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{c.name_en}</p>
                  <p className="text-xs text-muted-foreground">/{c.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingCat({ id: c.id, slug: c.slug, name_en: c.name_en, name_ar: c.name_ar ?? "", name_ku: c.name_ku ?? "" })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={async () => { if (!confirm("Delete category?")) return; await deleteCategory.mutateAsync(c.id); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Post editor */}
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? "Edit post" : "New post"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Slug</Label>
                    <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} placeholder="auto from title" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={editing.status ?? "draft"} onValueChange={(v) => setEditing({ ...editing, status: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={editing.category_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cover image URL</Label>
                  <Input value={editing.cover_image ?? ""} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })} />
                </div>

                <Tabs defaultValue="en">
                  <TabsList><TabsTrigger value="en">EN</TabsTrigger><TabsTrigger value="ar">AR</TabsTrigger><TabsTrigger value="ku">KU</TabsTrigger></TabsList>
                  {(["en","ar","ku"] as const).map((lng) => (
                    <TabsContent key={lng} value={lng} className="space-y-3">
                      <div><Label>Title ({lng.toUpperCase()})</Label><Input value={(editing as any)[`title_${lng}`] ?? ""} onChange={(e) => setEditing({ ...editing, [`title_${lng}`]: e.target.value })} /></div>
                      <div><Label>Excerpt ({lng.toUpperCase()})</Label><Textarea rows={2} value={(editing as any)[`excerpt_${lng}`] ?? ""} onChange={(e) => setEditing({ ...editing, [`excerpt_${lng}`]: e.target.value })} /></div>
                      <div><Label>Content ({lng.toUpperCase()}) — markdown supported</Label><Textarea rows={12} value={(editing as any)[`content_${lng}`] ?? ""} onChange={(e) => setEditing({ ...editing, [`content_${lng}`]: e.target.value })} /></div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="grid grid-cols-1 gap-3 pt-2 border-t">
                  <div><Label>SEO title</Label><Input value={editing.meta_title ?? ""} onChange={(e) => setEditing({ ...editing, meta_title: e.target.value })} /></div>
                  <div><Label>SEO description</Label><Textarea rows={2} value={editing.meta_description ?? ""} onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })} /></div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={savePost} disabled={upsertPost.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category editor */}
        <Dialog open={!!editingCat} onOpenChange={(o) => !o && setEditingCat(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCat?.id ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
            {editingCat && (
              <div className="space-y-3">
                <div><Label>Slug</Label><Input value={editingCat.slug} onChange={(e) => setEditingCat({ ...editingCat, slug: slugify(e.target.value) })} /></div>
                <div><Label>Name (EN)</Label><Input value={editingCat.name_en} onChange={(e) => setEditingCat({ ...editingCat, name_en: e.target.value })} /></div>
                <div><Label>Name (AR)</Label><Input value={editingCat.name_ar} onChange={(e) => setEditingCat({ ...editingCat, name_ar: e.target.value })} /></div>
                <div><Label>Name (KU)</Label><Input value={editingCat.name_ku} onChange={(e) => setEditingCat({ ...editingCat, name_ku: e.target.value })} /></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCat(null)}>Cancel</Button>
              <Button onClick={saveCategory}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminBlogManager;
