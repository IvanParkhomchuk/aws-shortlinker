import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as uuid from 'uuid';

const validator = require("validator");
const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async(event: any) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { email, password } = requestBody;
        const saltRounds = 10;
        
        const queryParams = {
            TableName: process.env.USERS_TABLE,
            IndexName: "EmailIndex",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email,
            },
        };

        const result = await ddbDocClient.send(new QueryCommand(queryParams));

        if (result.Count && result.Count > 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Email already exists" }),
            }
        }
        if (!validator.isEmail(email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Email is required and must be a string" }),
            };
        }
        if (!password || typeof password !== "string") {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Password is required and must be a string" }),
            };
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds); 

        const userId = uuid.v4()
        const putParams = {
            TableName: process.env.USERS_TABLE,
            Item: {
                userId: userId,
                email: email,
                password: hashedPassword
            }
        };

        await ddbDocClient.send(new PutCommand(putParams));

        const accessToken = jwt.sign({ userId: userId }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ userId: userId }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "7d" });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Signup received successfuly", accessToken, refreshToken }),
        };
    } catch (err) {
        console.error("Signup error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};