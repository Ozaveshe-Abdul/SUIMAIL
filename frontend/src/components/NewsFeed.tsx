// src/components/NewsFeed.tsx
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, AlertCircle, Globe } from "lucide-react";
import {
    Box,
    Flex,
    Text,
    Card,
    ScrollArea,
    Skeleton,
    Grid,
    Inset,
} from "@radix-ui/themes";

interface NewsArticle {
    id: string;
    guid: string;
    published_on: number;
    imageurl: string;
    title: string;
    url: string;
    source: string;
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
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN");
                if (!res.ok) throw new Error("Network error");
                const data = await res.json();
                if (data.Type !== 100) throw new Error(data.Message || "API error");
                setArticles(data.Data.slice(0, 20));
            } catch (err: any) {
                setError(err.message || "Failed to load news");
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // Helper style for robust multi-line truncation
    const truncateStyle = (lines: number): React.CSSProperties => ({
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
    });

    // INJECTED CSS FOR HOVER EFFECTS
    // This ensures hover works regardless of Tailwind config
    const customStyles = `
        .news-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .news-card:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 10;
        }
        .news-img {
            transition: transform 0.5s ease;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .news-card:hover .news-img {
            transform: scale(1.1);
        }
    `;

    if (loading) {
        return (
            <ScrollArea className="h-full">
                <Box p="4">
                    <Grid columns={{ initial: "1", sm: "2", md: "3", lg: "4" }} gap="4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} style={{ height: "320px", background: "rgba(255,255,255,0.05)" }}>
                                <Inset side="top" pb="current">
                                    <Skeleton width="100%" height="150px" />
                                </Inset>
                                <Box pt="2" className="space-y-3">
                                    <Skeleton height="20px" width="90%" />
                                    <Skeleton height="16px" width="80%" />
                                    <Skeleton height="16px" width="60%" />
                                </Box>
                            </Card>
                        ))}
                    </Grid>
                </Box>
            </ScrollArea>
        );
    }

    if (error) {
        return (
            <Flex direction="column" align="center" justify="center" height="100%" gap="4">
                <AlertCircle size={32} style={{ color: "#f87171" }} />
                <Text color="red">Failed to load news</Text>
                <Text color="gray" size="2">{error}</Text>
            </Flex>
        );
    }

    return (
        <ScrollArea className="h-full">
            {/* Inject the custom styles */}
            <style>{customStyles}</style>

            <Box p="4">
                <Grid columns={{ initial: "1", sm: "2", md: "3", lg: "4" }} gap="4" width="auto">
                    {articles.map((article) => {
                        const timeAgo = formatDistanceToNow(new Date(article.published_on * 1000), {
                            addSuffix: true,
                        });

                        return (
                            <Card
                                key={article.guid}
                                size="2"
                                // Applied custom class here
                                className="news-card"
                                style={{
                                    height: "340px",
                                    background: "rgba(255, 255, 255, 0.08)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    overflow: "hidden",
                                    cursor: "pointer"
                                }}
                            >
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ position: "absolute", inset: 0, zIndex: 10 }}
                                    aria-label={`Read: ${article.title}`}
                                />

                                <Inset side="top" clip="padding-box" pb="current">
                                    <Box height="150px" style={{ background: "#000", overflow: "hidden" }}>
                                        <img
                                            src={article.imageurl}
                                            alt=""
                                            // Applied custom class here
                                            className="news-img"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    "https://via.placeholder.com/400x200/1e1b4b/94a3b8?text=News";
                                            }}
                                        />
                                    </Box>
                                </Inset>

                                <Flex direction="column" height="100%" justify="between">
                                    <Box>
                                        <Flex align="center" gap="2" mb="2">
                                            {article.source_info.img ? (
                                                <img
                                                    src={article.source_info.img}
                                                    alt=""
                                                    style={{ width: 16, height: 16, borderRadius: "50%" }}
                                                />
                                            ) : (
                                                <Globe size={14} color="#94a3b8" />
                                            )}
                                            <Text size="1" color="gray" style={{ opacity: 0.8 }}>
                                                {article.source_info.name}
                                            </Text>
                                        </Flex>

                                        <Text
                                            size="3"
                                            weight="bold"
                                            style={{
                                                ...truncateStyle(2),
                                                color: "#f1f5f9",
                                                marginBottom: "8px",
                                                lineHeight: "1.3"
                                            }}
                                            title={article.title}
                                        >
                                            {article.title}
                                        </Text>

                                        <Text
                                            size="2"
                                            color="gray"
                                            style={{
                                                ...truncateStyle(3),
                                                opacity: 0.7,
                                                lineHeight: "1.4"
                                            }}
                                        >
                                            {article.body}
                                        </Text>
                                    </Box>

                                    <Flex align="center" justify="between" pt="3" mt="auto">
                                        <Text size="1" color="gray">
                                            {timeAgo}
                                        </Text>
                                        <ExternalLink size={14} color="#38bdf8" />
                                    </Flex>
                                </Flex>
                            </Card>
                        );
                    })}
                </Grid>
            </Box>
        </ScrollArea>
    );
};

export default NewsFeed;
