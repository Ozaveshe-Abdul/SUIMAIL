import { useEffect, useState } from "react";
import {
    Box,
    Flex,
    Text,
    Card,
    ScrollArea,
    Skeleton,
} from "@radix-ui/themes";
import { ExternalLink, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NewsArticle {
    id: string;
    published_on: number;
    imageUrl: string;
    title: string;
    url: string;
    body: string;
    source_info: {
        name: string;
        img: string;
    };
}

const NewsFeed = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
                if (!res.ok) throw new Error("Network error");
                const json = await res.json();
                if (json.Type !== 100) throw new Error(json.Message || "API error");
                setArticles(json.Data.slice(0, 20));
            } catch (err: any) {
                setError(err.message || "Failed to load news");
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // Loading State
    if (loading) {
        return (
            <ScrollArea className="h-full">
                <Box p="4" className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card
                            key={i}
                            style={{
                                background: "rgba(255, 255, 255, 0.08)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(255, 255, 255, 0.15)",
                            }}
                        >
                            <Flex gap="4" p="4" align="center">
                                <Skeleton>
                                    <Box width="90px" height="90px" className="rounded-xl" />
                                </Skeleton>
                                <Box className="flex-1 space-y-3">
                                    <Skeleton height="20px" width="85%" />
                                    <Skeleton height="16px" width="70%" />
                                    <Skeleton height="16px" width="50%" />
                                </Box>
                            </Flex>
                        </Card>
                    ))}
                </Box>
            </ScrollArea>
        );
    }

    // Error State
    if (error) {
        return (
            <Flex height="100%" align="center" justify="center" direction="column" gap="3">
                <Text size="5" weight="bold" style={{ color: "#ef4444" }}>
                    Failed to load news
                </Text>
                <Text size="2" style={{ color: "#94a3b8" }}>
                    {error}
                </Text>
            </Flex>
        );
    }

    // Success State
    return (
        <ScrollArea className="h-full">
            <Box p="4" className="space-y-4">
                {articles.map((article) => {
                    const timeAgo = formatDistanceToNow(new Date(article.published_on * 1000), {
                        addSuffix: true,
                    });

                    return (
                        <Card
                            key={article.id}
                            className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                            style={{
                                background: "rgba(255, 255, 255, 0.12)",
                                backdropFilter: "blur(16px)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                cursor: "pointer",
                            }}
                        >
                            {/* Full-card clickable link */}
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 z-10"
                                aria-label={`Read article: ${article.title}`}
                            >
                                <span className="sr-only">Open article</span>
                            </a>

                            <Flex gap="4" p="4">
                                {/* Thumbnail */}
                                <Box
                                    width="90px"
                                    height="90px"
                                    className="flex-shrink-0 rounded-xl overflow-hidden bg-white/10"
                                >
                                    <img
                                        src={article.imageUrl}
                                        alt=""
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                                "https://via.placeholder.com/90/1e1b4b/94a3b8?text=N";
                                        }}
                                    />
                                </Box>

                                {/* Content */}
                                <Box className="flex-1">
                                    <Text
                                        size="4"
                                        weight="bold"
                                        className="line-clamp-2 leading-tight"
                                        style={{ color: "#e0f2fe" }}
                                    >
                                        {article.title}
                                    </Text>

                                    <Text
                                        size="2"
                                        className="mt-2 line-clamp-2"
                                        style={{ color: "#94a3b8" }}
                                    >
                                        {article.body}
                                    </Text>

                                    <Flex mt="4" align="center" justify="between">
                                        <Flex align="center" gap="3" style={{ fontSize: "12px", color: "#64748b" }}>
                                            {article.source_info.img ? (
                                                <img
                                                    src={article.source_info.img}
                                                    alt={article.source_info.name}
                                                    className="w-4 h-4 rounded-full"
                                                />
                                            ) : (
                                                <Globe size={14} />
                                            )}
                                            <Text>{article.source_info.name}</Text>
                                            <Text>•</Text>
                                            <Text>{timeAgo}</Text>
                                        </Flex>

                                        <ExternalLink
                                            size={16}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ color: "#38bdf8" }}
                                        />
                                    </Flex>
                                </Box>
                            </Flex>
                        </Card>
                    );
                })}
            </Box>
        </ScrollArea>
    );
};

export default NewsFeed;
