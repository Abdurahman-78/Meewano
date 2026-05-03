import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  slug: string;
  author_id: string;
  category_id: string | null;
  title_en: string; title_ar: string | null; title_ku: string | null;
  excerpt_en: string | null; excerpt_ar: string | null; excerpt_ku: string | null;
  content_en: string; content_ar: string | null; content_ku: string | null;
  cover_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string; slug: string; name_en: string; name_ar: string | null; name_ku: string | null; description: string | null;
}

export interface BlogTag { id: string; slug: string; name: string; }

export const usePublishedPosts = (categorySlug?: string) =>
  useQuery({
    queryKey: ["blog-posts-published", categorySlug],
    queryFn: async () => {
      let q = supabase.from("blog_posts").select("*, blog_categories(slug, name_en)").eq("status", "published").order("published_at", { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      let posts = data as any[];
      if (categorySlug) posts = posts.filter((p) => p.blog_categories?.slug === categorySlug);
      return posts;
    },
  });

export const usePostBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ["blog-post", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(slug, name_en, name_ar, name_ku), blog_post_tags(blog_tags(id, slug, name))")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        // bump view count (fire and forget)
        supabase.from("blog_posts").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", data.id).then();
      }
      return data;
    },
  });

export const useAllPostsAdmin = () =>
  useQuery({
    queryKey: ["blog-posts-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*, blog_categories(name_en)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useBlogCategories = () =>
  useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_categories").select("*").order("name_en");
      if (error) throw error;
      return data as BlogCategory[];
    },
  });

export const useBlogTags = () =>
  useQuery({
    queryKey: ["blog-tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_tags").select("*").order("name");
      if (error) throw error;
      return data as BlogTag[];
    },
  });

export const useUpsertPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Partial<BlogPost> & { id?: string }) => {
      const payload = { ...post, updated_at: new Date().toISOString() };
      if (post.status === "published" && !post.published_at) payload.published_at = new Date().toISOString();
      if (post.id) {
        const { data, error } = await supabase.from("blog_posts").update(payload).eq("id", post.id).select().single();
        if (error) throw error; return data;
      } else {
        const { data, error } = await supabase.from("blog_posts").insert(payload as any).select().single();
        if (error) throw error; return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      qc.invalidateQueries({ queryKey: ["blog-posts-published"] });
    },
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-posts-admin"] }),
  });
};

export const useUpsertCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Partial<BlogCategory> & { id?: string }) => {
      if (cat.id) {
        const { error } = await supabase.from("blog_categories").update(cat).eq("id", cat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_categories").insert(cat as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-categories"] }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-categories"] }),
  });
};
