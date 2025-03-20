import express from "express"
import "dotenv/config"
import postRoutes from "./routes/posts.routes"
const app = express();

const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use("/api", postRoutes)
app.listen(PORT , () => {
    console.log(`server started at : ${PORT}`);
})

