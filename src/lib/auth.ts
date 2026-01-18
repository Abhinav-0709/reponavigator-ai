import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// Since we are using Mongoose elsewhere, we can reuse the connection logic or just pass a standard client.
// Better Auth's MongoDB adapter expects a standard MongoClient or DB instance.
// For simplicity and to avoid Mongoose schema conflicts with Better Auth's internals, 
// we'll use a raw MongoClient here share the URI.

const client = new MongoClient(process.env.MONGODB_URI as string);
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
});
