const { Role, Permission, User } = require('../models');

/** In-memory permission cache: userId -> { expires, roleName, permissions } */
const permCache = new Map();
const PERM_TTL_MS = Number(process.env.PERM_CACHE_TTL_MS) || 60_000; // 60s default

function invalidateUserPermissions(userId) {
    if (userId != null) permCache.delete(Number(userId));
}

function invalidateAllPermissions() {
    permCache.clear();
}

/**
 * Permission check uses user-level permissions (user_permissions) as primary.
 * Admin/SuperAdmin role still gets full access. All others are checked against
 * the permissions assigned to that user in Create/Edit User.
 *
 * Results are cached briefly to avoid a full User+Role+Permission query on every request.
 */
const permissionMiddleware = (resource, action) => {
    return async (req, res, next) => {
        try {
            const userId = req.user && req.user.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const cacheKey = Number(userId);
            const now = Date.now();
            let cached = permCache.get(cacheKey);

            if (!cached || cached.expires <= now) {
                let user = null;
                try {
                    user = await User.findByPk(userId, {
                        include: [
                            { model: Role, as: 'role', include: [{ model: Permission, as: 'permissions', through: { attributes: [] }, attributes: ['id', 'resource', 'action'] }] },
                            { model: Permission, as: 'permissions', through: { attributes: [] }, attributes: ['id', 'resource', 'action'] }
                        ]
                    });
                } catch (queryErr) {
                    console.error('Permission Middleware: user load failed, trying role-only', queryErr.message);
                    try {
                        user = await User.findByPk(userId, {
                            include: [{ model: Role, as: 'role', include: [{ model: Permission, as: 'permissions', through: { attributes: [] }, attributes: ['id', 'resource', 'action'] }] }]
                        });
                    } catch (e2) {
                        console.error('Permission Middleware Error:', e2);
                        return res.status(500).json({ message: 'Server Error' });
                    }
                }

                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                cached = {
                    expires: now + PERM_TTL_MS,
                    roleName: user.role ? user.role.name : null,
                    permissions: user.permissions || []
                };
                permCache.set(cacheKey, cached);
            }

            // Admin/SuperAdmin: full access
            if (cached.roleName === 'Admin' || cached.roleName === 'SuperAdmin') {
                return next();
            }

            const perms = cached.permissions || [];
            const hasPermission = perms.some(
                perm => perm && perm.resource === resource && (perm.action === action || perm.action === '*')
            );

            if (hasPermission) {
                next();
            } else {
                res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
            }
        } catch (error) {
            console.error('Permission Middleware Error:', error);
            res.status(500).json({ message: 'Server Error' });
        }
    };
};

permissionMiddleware.invalidateUserPermissions = invalidateUserPermissions;
permissionMiddleware.invalidateAllPermissions = invalidateAllPermissions;

module.exports = permissionMiddleware;
