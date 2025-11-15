const connection = require('../config/database');

const userMappingController = {
    // Get backend user ID from mock ID
    getBackendUserId: async (mockId) => {
        try {
            const [mappings] = await connection.query(
                'SELECT backend_id FROM UserMapping WHERE mock_id = ?',
                [mockId]
            );

            if (mappings.length === 0) {
                return null;
            }

            return mappings[0].backend_id;
        } catch (error) {
            console.error('Error getting backend user ID:', error);
            throw error;
        }
    },

    // Get mock user ID from backend ID
    getMockUserId: async (backendId) => {
        try {
            const [mappings] = await connection.query(
                'SELECT mock_id FROM UserMapping WHERE backend_id = ?',
                [backendId]
            );

            if (mappings.length === 0) {
                return null;
            }

            return mappings[0].mock_id;
        } catch (error) {
            console.error('Error getting mock user ID:', error);
            throw error;
        }
    },

    // Get user mapping by email
    getMappingByEmail: async (email) => {
        try {
            const [mappings] = await connection.query(
                'SELECT * FROM UserMapping WHERE email = ?',
                [email]
            );

            if (mappings.length === 0) {
                return null;
            }

            return mappings[0];
        } catch (error) {
            console.error('Error getting mapping by email:', error);
            throw error;
        }
    },

    // API endpoint to resolve user ID
    resolveUserId: async (req, res) => {
        try {
            const { mockId, backendId, email } = req.query;

            let result = null;

            if (mockId) {
                // Convert mock ID to backend ID
                const backendUserId = await userMappingController.getBackendUserId(mockId);
                if (backendUserId) {
                    result = { mockId, backendId: backendUserId };
                }
            } else if (backendId) {
                // Convert backend ID to mock ID
                const mockUserId = await userMappingController.getMockUserId(backendId);
                if (mockUserId) {
                    result = { backendId, mockId: mockUserId };
                }
            } else if (email) {
                // Get mapping by email
                const mapping = await userMappingController.getMappingByEmail(email);
                if (mapping) {
                    result = {
                        mockId: mapping.mock_id,
                        backendId: mapping.backend_id,
                        email: mapping.email
                    };
                }
            }

            if (result) {
                res.json({ success: true, mapping: result });
            } else {
                res.status(404).json({ success: false, error: 'Mapping not found' });
            }
        } catch (error) {
            console.error('Error resolving user ID:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
};

module.exports = userMappingController;
