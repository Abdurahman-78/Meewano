import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft } from "lucide-react";
import { usePostBySlug } from "@/hooks/useBlog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet-async";
import MarkdownLite from "@/components/MarkdownLite";

const BlogPost = () => {
  const { slug } = useParams();
  const { language } = useLanguage();
  const { data: post, isLoading } = usePostBySlug(slug);

  const t = (field: "title" | "content" | "excerpt") => {
    if (!post) return "";
    return (post as any)[`${field}_${language}`] || (post as any)[`${field}_en`];
  };

  if (isLoading) {
    return (
      <AppLayout>
        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </main>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <Link to="/blog" className="text-primary hover:underline">← Back to blog</Link>
        </main>
      </AppLayout>
    );
  }

  const title = t("title");
  const content = t("content");

  return (
    <AppLayout>
      <Helmet>
        <title>{post.meta_title || `${title} — Meewano Blog`}</title>
        <meta name="description" content={post.meta_description || t("excerpt") || title} />
        <link rel="canonical" href={`/blog/${post.slug}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={post.meta_description || t("excerpt") || ""} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          image: post.cover_image,
          datePublished: post.published_at,
          dateModified: post.updated_at,
        })}</script>
      </Helmet>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to blog
        </Link>

        {post.blog_categories && (
          <Badge variant="secondary" className="mb-3">{(post.blog_categories as any).name_en}</Badge>
        )}
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Calendar className="h-4 w-4" />
          {post.published_at && new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </div>

        {post.cover_image && (
          <img src={post.cover_image} alt={title} className="w-full rounded-xl mb-8 max-h-[480px] object-cover" />
        )}

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <MarkdownLite text={content} />
        </article>

        {post.blog_post_tags && (post.blog_post_tags as any[]).length > 0 && (
          <div className="mt-10 pt-6 border-t flex flex-wrap gap-2">
            {(post.blog_post_tags as any[]).map((pt) => (
              <Badge key={pt.blog_tags.id} variant="outline">#{pt.blog_tags.name}</Badge>
            ))}
          </div>
        )}
      </main>
    </AppLayout>
  );
};

export default BlogPost;
