const connection = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Extract YouTube video ID from URL
const extractYouTubeId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
};

const videoController = {
    // Create new video
    createVideo: async (req, res) => {
        try {
            const { title, description, youtube_url, subject, grade_level, duration, created_by } = req.body;

            if (!title || !youtube_url || !created_by) {
                return res.status(400).json({ error: 'Required fields are missing' });
            }

            // Extract YouTube ID
            const youtubeId = extractYouTubeId(youtube_url);
            if (!youtubeId) {
                return res.status(400).json({ error: 'Invalid YouTube URL' });
            }

            // Generate thumbnail URL
            const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;

            const videoId = uuidv4();

            await connection.query(
                'INSERT INTO Videos (id, title, description, youtube_url, youtube_id, subject, grade_level, duration, thumbnail_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [videoId, title, description, youtube_url, youtubeId, subject, grade_level, duration, thumbnailUrl, created_by]
            );

            const [video] = await connection.query('SELECT * FROM Videos WHERE id = ?', [videoId]);

            res.status(201).json({
                message: 'Video created successfully',
                video: video[0]
            });
        } catch (error) {
            console.error('Create video error:', error);
            res.status(500).json({ error: 'Failed to create video' });
        }
    },

    // Get all videos with optional filters
    getAllVideos: async (req, res) => {
        try {
            const { subject, grade_level, created_by } = req.query;
            
            let query = 'SELECT v.*, u.name as creator_name FROM Videos v LEFT JOIN Users u ON v.created_by = u.id WHERE 1=1';
            const params = [];
            
            if (subject) {
                query += ' AND v.subject = ?';
                params.push(subject);
            }
            if (grade_level) {
                query += ' AND v.grade_level = ?';
                params.push(grade_level);
            }
            if (created_by) {
                query += ' AND v.created_by = ?';
                params.push(created_by);
            }
            
            query += ' ORDER BY v.created_at DESC';
            
            const [videos] = await connection.query(query, params);
            res.json({ videos });
        } catch (error) {
            console.error('Get videos error:', error);
            res.status(500).json({ error: 'Failed to fetch videos' });
        }
    },

    // Get video by ID
    getVideoById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [videos] = await connection.query(
                'SELECT v.*, u.name as creator_name FROM Videos v LEFT JOIN Users u ON v.created_by = u.id WHERE v.id = ?',
                [id]
            );
            
            if (videos.length === 0) {
                return res.status(404).json({ error: 'Video not found' });
            }
            
            res.json({ video: videos[0] });
        } catch (error) {
            console.error('Get video error:', error);
            res.status(500).json({ error: 'Failed to fetch video' });
        }
    },

    // Update video
    updateVideo: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            // Check if video exists
            const [existing] = await connection.query('SELECT * FROM Videos WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Video not found' });
            }
            
            // If youtube_url is updated, extract new ID and thumbnail
            if (updates.youtube_url) {
                const youtubeId = extractYouTubeId(updates.youtube_url);
                if (!youtubeId) {
                    return res.status(400).json({ error: 'Invalid YouTube URL' });
                }
                updates.youtube_id = youtubeId;
                updates.thumbnail_url = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
            }
            
            if (Object.keys(updates).length > 0) {
                const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
                const values = [...Object.values(updates), id];
                
                await connection.query(
                    `UPDATE Videos SET ${setClause} WHERE id = ?`,
                    values
                );
            }
            
            res.json({ message: 'Video updated successfully' });
        } catch (error) {
            console.error('Update video error:', error);
            res.status(500).json({ error: 'Failed to update video' });
        }
    },

    // Delete video
    deleteVideo: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [existing] = await connection.query('SELECT * FROM Videos WHERE id = ?', [id]);
            if (existing.length === 0) {
                return res.status(404).json({ error: 'Video not found' });
            }
            
            await connection.query('DELETE FROM Videos WHERE id = ?', [id]);
            res.json({ message: 'Video deleted successfully' });
        } catch (error) {
            console.error('Delete video error:', error);
            res.status(500).json({ error: 'Failed to delete video' });
        }
    }
};

module.exports = videoController;
