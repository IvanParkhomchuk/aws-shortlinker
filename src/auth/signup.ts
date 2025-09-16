import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient();

export const handler = async(event: any) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { username, password } = requestBody;

        const saltRounds = 10;
        
        if (!username || typeof username !== "string") {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username is required and must be a string" }),
            };
        }
        if (!password || typeof password !== "string") {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Password is required and must be a string" }),
            };
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds); 

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Signup received", username, password }),
        };
    } catch (err) {
        console.error("Signup error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};