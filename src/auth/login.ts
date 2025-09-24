import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async(event: any) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { username, password } = requestBody;

        const queryParams = {
            TableName: process.env.USERS_TABLE,
            IndexName: "UsernameIndex",
            KeyConditionExpression: "username = :username",
            ExpressionAttributeValues: {
                ":username": username,
            },
        };

        const result = await ddbDocClient.send(new QueryCommand(queryParams));
        const user = result.Items![0];

        if (!user || !await bcrypt.compare(password, user!.password)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid username or password' }),
            }
        }

        const accessToken = jwt.sign({ userId: user.userId }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ userId: user.userId }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Login received successfuly", accessToken, refreshToken }),
        }
    } catch (err) {
        console.error("Login error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};