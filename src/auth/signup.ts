import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import bcrypt from "bcryptjs";
import * as uuid from 'uuid';

const client = new DynamoDBClient();

export const handler = async(event: any) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { username, password } = requestBody;
        const saltRounds = 10;
        
        const queryParams = {
            TableName: process.env.USERS_TABLE,
            IndexName: "UsernameIndex",
            KeyConditionExpression: "username = :username",
            ExpressionAttributeValues: {
                ":username": { S: username },
            },
        };

        const result = await client.send(new QueryCommand(queryParams));

        if (result.Count && result.Count > 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Username already exists" }),
            }
        }
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
        const putParams = {
            TableName: process.env.USERS_TABLE,
            Item: {
                userId: { S: uuid.v4() },
                username: { S: username },
                password: { S: hashedPassword }
            }
        };

        await client.send(new PutItemCommand(putParams));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Signup received successfuly", username }),
        };
    } catch (err) {
        console.error("Signup error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};