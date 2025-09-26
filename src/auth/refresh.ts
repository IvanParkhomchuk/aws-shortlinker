import jwt, { JwtPayload } from "jsonwebtoken";

export const handler = async (event: any) => {
    try {
        const refreshToken = event.headers['x-refresh-token'];
        const { email } = JSON.parse(event.body);

        if (!refreshToken) {
            throw new Error('Refresh token expired or not provided');
        }

        const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload;
        const accessToken = jwt.sign({ userId: user.userId }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "15m" });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Token refreshed successfully", accessToken }),
        }
    } catch (err) {
        console.error("Refresh error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};