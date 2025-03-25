const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const uuid = require('uuid');

/**
 * register new user
 * request body:
 *   - utorid: string (Unique, Alphanumeric, 8 characters)
 *   - name: string (1-50 characters)
 *   - email: string (Unique, Valid University of Toronto email)
 */
async function registerUser(req, res) {
    const { utorid, name, email } = req.body;

    // validate fields
    if (!utorid || !name || !email) {
        return res.status(400).json({ error: 'missing required fields' });
    }
    if (!/^[A-Za-z0-9]{8}$/.test(utorid)) {
        return res.status(400).json({ error: 'utorid must be exactly 8 alphanumeric characters' });
    }
    if (name.length < 1 || name.length > 50) {
        return res.status(400).json({ error: 'name must be between 1 and 50 characters' });
    }
    if (!/^[\w\.-]+@mail\.utoronto\.ca$/.test(email)) {
        return res.status(400).json({ error: 'email must be a valid University of Toronto email' });
    }

    try {
        // check for existing user
        const existingUser = await prisma.user.findUnique({ where: { utorid } });
        if (existingUser) {
            return res.status(409).json({ error: 'user with this utorid already exists' });
        }

        // generate activation token
        const resetToken = uuid.v4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // create user
        const newUser = await prisma.user.create({
            data: {
                utorid,
                name,
                email,
                resetToken,
                expiresAt,
                password: 'temporary_password',
            },
        });

        // response
        return res.status(201).json({
            id: newUser.id,
            utorid: newUser.utorid,
            name: newUser.name,
            email: newUser.email,
            verified: newUser.verified,
            expiresAt: newUser.expiresAt,
            resetToken: newUser.resetToken,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'server error while creating user' });
    }
}

/**
 * retrieve a list of users
 * query parameters:
 *   - name: string (Filter by utorid or name)
 *   - role: string (Filter by user role)
 *   - verified: boolean (Filter by verified status)
 *   - activated: boolean (Filter by whether the user has ever logged in before)
 *   - page: number (Page number for pagination (default is 1))
 *   - limit: number (Number of objects per page (default is 10))
 */
async function listUsers(req, res) {
    const { name, role, verified, activated, page = 1, limit = 10 } = req.query;

    // filter object
    const filters = {};
    if (name) {
        filters.OR = [
            { utorid: { contains: name } },
            { name: { contains: name } },
        ];
    }
    if (role) {
        filters.role = role.toUpperCase();
    }
    if (verified != null) {
        filters.verified = verified === 'true';
    }
    if (activated != null) {
        filters.lastLogin = activated === 'true' ? { not: null } : null;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // are page and limit postive?
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ error: 'page and limit must be positive integers' });
    }

    const skip = (pageNum - 1) * limitNum;

    try {
        // find users, applying filters and pagination
        const results = await prisma.user.findMany({
            where: filters,
            skip,
            take: limitNum,
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            },
        });

        // total results after filter
        const count = await prisma.user.count({ where: filters });

        return res.json({ count, results });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'server error while fetching users' });
    }
}

/**
 * retrieve a specific user
 * - if cashier, return limited info
 * - if manager or superuser, return full details
 */
async function getUser(req, res) {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'invalid userId parameter' });
    }

    try {
        // manager or superuser
        if (req.user.role === 'MANAGER' || req.user.role === 'SUPERUSER') {
            const userRecord = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    email: true,
                    birthday: true,
                    role: true,
                    points: true,
                    createdAt: true,
                    lastLogin: true,
                    verified: true,
                    avatarUrl: true,
                },
            });
            if (!userRecord) return res.status(404).json({ error: 'user not found' });
            return res.json({ ...userRecord, promotions: [] });
        }
        else {
            // cashier
            const userRecord = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    points: true,
                    verified: true,
                    userPromotions: {
                        where: {
                            used: false,
                            promotion: { type: 'ONE_TIME' },
                        },
                        include: {
                            promotion: {
                                select: {
                                    id: true,
                                    name: true,
                                    minSpending: true,
                                    rate: true,
                                    points: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!userRecord) return res.status(404).json({ error: 'user not found' });
            // userPromotions to array of promotion details
            const promotions = userRecord.userPromotions.map(up => up.promotion);
            return res.json({
                id: userRecord.id,
                utorid: userRecord.utorid,
                name: userRecord.name,
                points: userRecord.points,
                verified: userRecord.verified,
                promotions,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'server error while retrieving user' });
    }
}

/**
 * user update
 * request body:
 *   - email: string
 *   - verified: boolean (Should always be set to true)
 *   - suspicious: boolean
 *   - role: string (Either "cashier" or "regular")
 */
async function updateUser(req, res) {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'invalid userId' });
    }

    const { email, verified, suspicious, role } = req.body;
    if (email == null && verified == null && suspicious == null && role == null) {
        return res.status(400).json({ error: 'no valid fields provided for update' });
    }

    const updateData = {};
    // validations
    if (email != null && email !== null) {
        if (!/^[\w\.-]+@mail\.utoronto\.ca$/.test(email)) {
            return res.status(400).json({ error: 'email must be a valid University of Toronto email' });
        }
        updateData.email = email;
    }
    if (verified != null && verified !== null) { 
        if (!verified) {
            return res.status(400).json({ error: 'the verified field must be set to true' });
        }
        updateData.verified = true;
    }
    if (suspicious != null && suspicious !== null) {
        if (typeof suspicious !== 'boolean') {
            return res.status(400).json({ error: 'suspicious must be a boolean' });
        }
        updateData.suspicious = suspicious;
    }
    if (role != null && role !== null) {
        const allowedRoles = req.user.role === 'SUPERUSER' ? ['CASHIER', 'REGULAR', 'MANAGER', 'SUPERUSER'] : ['CASHIER', 'REGULAR'];
        const newRole = role.toUpperCase();
        if (!allowedRoles.includes(newRole)) {
            return res.status(400).json({ error: 'invalid role' });
        }
        updateData.role = newRole;
    }

    try {
        // verify user
        const userRecord = await prisma.user.findUnique({ where: { id: userId } });
        if (!userRecord) return res.status(404).json({ error: 'user not found' });

        // update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                verified: true,
                suspicious: true,
                role: true,
            },
        });

        // build response
        const result = {
            id: updatedUser.id,
            utorid: updatedUser.utorid,
            name: updatedUser.name,
        };
        if (updateData.email != null) result.email = updatedUser.email;
        if (updateData.verified != null) result.verified = updatedUser.verified;
        if (updateData.suspicious != null) result.suspicious = updatedUser.suspicious;
        if (updateData.role != null) result.role = updatedUser.role;
        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'server error while updating user' });
    }
}

module.exports = {
    registerUser,
    listUsers,
    getUser,
    updateUser,
};