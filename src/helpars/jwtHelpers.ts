import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

const generateToken = (payload: any, secret: Secret, expiresIn: string): string => {
    const token = jwt.sign(
        payload,
        secret,
        {
            algorithm: 'HS256',
            expiresIn
        } as jwt.SignOptions // Explicitly type the options object
    );

    return token;
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
    return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
    generateToken,
    verifyToken
};