const roleHierarchy = {
    REGULAR: 1,
    CASHIER: 2,
    MANAGER: 3,
    SUPERUSER: 4,
};

function requireAuth(minRole) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (roleHierarchy[req.user.role] < roleHierarchy[minRole]) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

module.exports = { requireAuth };
