import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { usePublishedPosts, useBlogCategories } from "@/hooks/useBlog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const Blog = () => {
  const { language } = useLanguage();
  const [activeCat, setActiveCat] = useState<string | undefined>(undefined);
  const { data: posts, isLoading } = usePublishedPosts(activeCat);
  const { data: categories } = useBlogCategories();

  const t = (post: any, field: "title" | "excerpt") => {
    const key = `${field}_${language}`;
    return post[key] || post[`${field}_en`];
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Blog — Meewano | Travel & Stays in Kurdistan</title>
        <meta name="description" content="Stories, guides, and tips for travelers exploring Kurdistan. Discover hidden gems, local culture, and the best places to stay." />
        <link rel="canonical" href="/blog" />
      </Helmet>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mb-8">
          <h1 className="text-4xl font-bold mb-3">Blog</h1>
          <p className="text-muted-foreground">Stories, guides, and tips from across Kurdistan.</p>
        </div>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant={!activeCat ? "default" : "outline"} size="sm" onClick={() => setActiveCat(undefined)}>All</Button>
            {categories.map((c) => (
              <Button key={c.id} variant={activeCat === c.slug ? "default" : "outline"} size="sm" onClick={() => setActiveCat(c.slug)}>
                {language === "ar" ? c.name_ar || c.name_en : language === "ku" ? c.name_ku || c.name_en : c.name_en}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {post.cover_image && (
                    <img src={post.cover_image} alt={t(post, "title")} className="w-full h-44 object-cover" loading="lazy" />
                  )}
                  <div className="p-5">
                    {post.blog_categories && (
                      <Badge variant="secondary" className="mb-2">{post.blog_categories.name_en}</Badge>
                    )}
                    <h2 className="font-semibold text-lg mb-2 line-clamp-2">{t(post, "title")}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{t(post, "excerpt")}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {post.published_at && new Date(post.published_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-muted-foreground">No posts yet — check back soon!</Card>
        )}
      </main>
    </AppLayout>
  );
};

export default Blog;
