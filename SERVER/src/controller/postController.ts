import { Request, Response } from "express";
import axios from "axios";

const USERS_API = process.env.USERS_API as string;
const POSTS_API = process.env.POSTS_API as string;
const API_TOKEN = process.env.API_TOKEN as string;

if (!USERS_API || !POSTS_API || !API_TOKEN) {
    throw new Error("API or Token not found");
}

// Axios config for Bearer Token
const axiosConfig = {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
};

interface UsersResponse {
    users: { [key: string]: string };
}

interface PostsResponse {
    posts?: { id: number; userid: number; content: string }[];
}

export const getTopUsers = async (req: Request, res: Response) => {
    try {
        const usersResponse = await axios.get<UsersResponse>(USERS_API, axiosConfig);
        const users = usersResponse.data.users;
        console.log("Fetched Users:", users); 

        let userPostCounts: { [key: string]: { name: string; postCount: number } } = {};

        await Promise.all(
            Object.entries(users).map(async ([userId, name]) => {
                const postsResponse = await axios.get<PostsResponse>(`${POSTS_API}/${userId}/posts`, axiosConfig);
                const posts = postsResponse.data.posts || [];

                console.log(`User ${name} (ID: ${userId}) has ${posts.length} posts`); 

                if (posts.length > 0) {
                    userPostCounts[userId] = { name, postCount: posts.length };
                }
            })
        );

        const sortedUsers = Object.values(userPostCounts)
            .sort((a, b) => b.postCount - a.postCount)
            .slice(0, 5);

        res.status(200).json({ success: true, topUsers: sortedUsers });
    } catch (error) {
        console.error("Error fetching top users:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getFilteredPosts = async (req: Request, res: Response) => {
    try {
        const filterType = req.params.filterType;
        console.log("Filter Type:", filterType); 

        const postsResponse = await axios.get<PostsResponse>(`${POSTS_API}/all`, axiosConfig);
        const posts = postsResponse.data.posts || [];

        console.log("Total Posts Fetched:", posts.length);

        if (posts.length === 0) {
            return res.status(200).json({ success: true, posts: [] });
        }

        let sortedPosts = posts;

        if (filterType === "popular") {
            const postsWithComments = await Promise.all(
                posts.map(async (post) => {
                    const commentsResponse = await axios.get<{ comments: any[] }>(
                        `${POSTS_API}/${post.id}/comments`,
                        axiosConfig
                    );
                    return { ...post, commentCount: commentsResponse.data.comments.length };
                })
            );

            sortedPosts = postsWithComments.sort((a, b) => b.commentCount - a.commentCount);
        } else if (filterType === "latest") {
            sortedPosts = posts.sort((a, b) => b.id - a.id);
        } else {
            return res.status(400).json({ success: false, message: "Invalid filter type" });
        }

        res.status(200).json({ success: true, posts: sortedPosts.slice(0, 5) });
    } catch (error) {
        console.error("Error fetching filtered posts:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
