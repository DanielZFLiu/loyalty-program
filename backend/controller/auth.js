const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')
const uuid = require('uuid')

const SECRET_KEY = 'jwt_secret'

// in-memory rate limiter for password reset requests
const resetRateLimit = {}

/**
 * authenticate user and generate jwt token
 * payload:
 *  - utorid: string (utorid of user)
 *  - password: string (password of user)
 */
async function generateToken(req, res) {
    const { utorid, password } = req.body
    if (!utorid || !password) {
        return res.status(400).json({ error: 'missing required fields' })
    }
    try {
        const user = await prisma.user.findUnique({ where: { utorid } })
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'invalid credentials' })
        }
        // token expires in 7 days
        const expiresIn = 7 * 24 * 60 * 60 // seconds
        const expiresAt = new Date(Date.now() + expiresIn * 1000)
        const token = jwt.sign({ id: user.id, utorid: user.utorid, role: user.role }, SECRET_KEY, { expiresIn })

        // update fields
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        return res.json({ token, expiresAt })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'server error while authenticating user' })
    }
}

/**
 * request password reset token
 * payload:
 *  - utorid: string (utorid of user who forgot password)
 */
async function requestReset(req, res) {
    const { utorid } = req.body
    if (!utorid) {
        return res.status(400).json({ error: 'missing required field utorid' })
    }
    // rate limiter: one request per ip every 60 seconds
    const ip = req.ip
    const now = Date.now()
    // if (resetRateLimit[ip] && (now - resetRateLimit[ip] < 60000)) {
    //     console.log(resetRateLimit[ip]);
    //     console.log(now);
    //     return res.status(429).json({ error: 'too many requests, please wait a while' })
    // }
    resetRateLimit[ip] = now
    try {
        const user = await prisma.user.findUnique({ where: { utorid } })
        if (!user) {
            return res.status(404).json({ error: 'user not found' })
        }
        const resetToken = uuid.v4()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)
        await prisma.user.update({
            where: { utorid },
            data: { resetToken, expiresAt },
        })
        return res.status(202).json({ resetToken, expiresAt })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'server error while requesting password reset token' })
    }
}

/**
 * reset password using reset token
 * payload:
 *  - utorid: string (utorid of user who requested password reset)
 *  - password: string (8-20 characters, at least one uppercase, one lowercase, one number, one special character)
 */
async function resetPassword(req, res) {
    const { resetToken } = req.params
    const { utorid, password } = req.body
    if (!utorid || !password) {
        return res.status(400).json({ error: 'missing required fields' })
    }
    // validate password complexity
    if (typeof password !== 'string' || password.length < 8 || password.length > 20) {
        return res.status(400).json({ error: 'password must be between 8 and 20 characters' })
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
        return res.status(400).json({ error: 'password must include at least one uppercase letter, one lowercase letter, one number, and one special character' })
    }
    try {
        const user = await prisma.user.findUnique({ where: { resetToken } });
        if (!user) {
            return res.status(404).json({ error: 'reset token not found' });
        }
        if (user.utorid !== utorid) {
            return res.status(401).json({ error: 'reset token utorid mismatch' });
        }
        if (!user.expiresAt || user.expiresAt < new Date()) {
            return res.status(410).json({ error: 'reset token expired' });
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { password, resetToken: null, expiresAt: null },
        });
        return res.json({ message: 'password reset successfully' });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'server error while resetting password' })
    }
}

module.exports = {
    generateToken,
    requestReset,
    resetPassword,
}