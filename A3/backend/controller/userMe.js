const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const uuid = require('uuid');

/**
 * retrieve current user info
 */
async function getMe(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userPromotions: {
                    include: {
                        promotion: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        const birthday = user.birthday ? user.birthday.toISOString().split('T')[0] : null;
        res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
            promotions: user.userPromotions.map(up => up.promotion) || [],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'server error while retrieving user data' });
    }
}

/**
 * update logged in user
 *
 * payload:
 *  - name: string (1-50 characters)
 *  - email: string (Unique, valid UofT email)
 *  - birthday: string (YYYY-MM-DD)
 *  - avatar: file (image file)
 */
async function updateMe(req, res) {
    const { name, email, birthday } = req.body;
    let avatarUrl;

    // empty payload
    if (name == null && email == null && birthday == null && !req.file) {
        return res.status(400).json({ error: 'Empty payload: at least one field must be provided' });
    }

    // process uploaded file
    if (req.file) {
        // assume file is stored in uploads/avatars
        avatarUrl = `/uploads/avatars/${req.file.filename}`;
        updateData.avatarUrl = avatarUrl;
    }

    const updateData = {};

    if (name != null) {
        if (typeof name !== 'string' || name.length < 1 || name.length > 50) {
            return res.status(400).json({ error: 'name must be between 1 and 50 characters' });
        }
        updateData.name = name;
    }

    if (email != null) {
        if (typeof email !== 'string' || !/^[\w\.-]+@mail\.utoronto\.ca$/.test(email)) {
            return res.status(400).json({ error: 'email must be a valid UofT email' });
        }
        updateData.email = email;
    }

    if (birthday != null) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
            return res.status(400).json({ error: 'birthday must be in the format YYYY-MM-DD' });
        }
        const [year, month, day] = birthday.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        if (
            dateObj.getFullYear() !== year ||
            dateObj.getMonth() !== month - 1 ||
            dateObj.getDate() !== day
        ) {
            return res.status(400).json({ error: 'invalid birthday date' });
        }
        updateData.birthday = dateObj;
    }

    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
        });
        const formattedBirthday = user.birthday ? user.birthday.toISOString().split('T')[0] : null;
        res.json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            birthday: formattedBirthday,
            role: user.role,
            points: user.points,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            verified: user.verified,
            avatarUrl: user.avatarUrl,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'server error while updating user data' });
    }
}

/**
 * update current logged-in user's password
 * 
 * payload:
 *  - old: string (The user's current password)
 *  - new: string (8-20 characters, at least one uppercase, one lowercase, one number, one special character)
 */
async function updatePassword(req, res) {
    const { old, new: newPassword } = req.body;
    if (!old || !newPassword) {
        return res.status(400).json({ error: 'both old and new passwords are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 20) {
        return res.status(400).json({ error: 'new password must be between 8 and 20 characters' });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(newPassword)) {
        return res.status(400).json({ error: 'new password must include at least one uppercase letter, one lowercase letter, one number, and one special character' });
    }
    try {
        // retrieve current user record
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        if (user.password !== old) {
            return res.status(401).json({ error: 'current password is incorrect' });
        }
        // update
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: newPassword },
        });
        res.status(200).json({ message: 'password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'server error while updating password' });
    }
}

module.exports = {
    getMe,
    updateMe,
    updatePassword,
};