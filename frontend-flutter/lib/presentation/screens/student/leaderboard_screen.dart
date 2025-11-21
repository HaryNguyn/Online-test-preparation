import 'package:flutter/material.dart';
import '../../../core/utils/storage_helper.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<LeaderboardEntry> _leaderboard = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';
  String? _currentUserId;

  final List<Map<String, String>> _filterOptions = [
    {'value': 'all', 'label': 'Tất cả'},
    {'value': 'week', 'label': 'Tuần này'},
    {'value': 'month', 'label': 'Tháng này'},
  ];

  @override
  void initState() {
    super.initState();
    _loadLeaderboard();
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    final userId = await StorageHelper().getUserId();
    setState(() => _currentUserId = userId);
  }

  Future<void> _loadLeaderboard() async {
    setState(() => _isLoading = true);
    try {
      // Mock data for now - replace with actual API call
      await Future.delayed(const Duration(seconds: 1));
      
      setState(() {
        _leaderboard = [
          LeaderboardEntry(
            userId: '1',
            userName: 'Nguyễn Văn A',
            avatarUrl: null,
            totalScore: 950,
            totalExams: 15,
            averageScore: 95.0,
            rank: 1,
          ),
          LeaderboardEntry(
            userId: '2',
            userName: 'Trần Thị B',
            avatarUrl: null,
            totalScore: 920,
            totalExams: 14,
            averageScore: 92.0,
            rank: 2,
          ),
          LeaderboardEntry(
            userId: '3',
            userName: 'Lê Văn C',
            avatarUrl: null,
            totalScore: 880,
            totalExams: 12,
            averageScore: 88.0,
            rank: 3,
          ),
          LeaderboardEntry(
            userId: '4',
            userName: 'Phạm Thị D',
            avatarUrl: null,
            totalScore: 850,
            totalExams: 13,
            averageScore: 85.0,
            rank: 4,
          ),
          LeaderboardEntry(
            userId: '5',
            userName: 'Hoàng Văn E',
            avatarUrl: null,
            totalScore: 820,
            totalExams: 11,
            averageScore: 82.0,
            rank: 5,
          ),
        ];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải bảng xếp hạng: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bảng xếp hạng'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadLeaderboard,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Section
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.surface,
            child: Row(
              children: [
                const Icon(Icons.filter_list),
                const SizedBox(width: 8),
                const Text(
                  'Lọc theo:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SegmentedButton<String>(
                    segments: _filterOptions.map((option) {
                      return ButtonSegment<String>(
                        value: option['value']!,
                        label: Text(option['label']!),
                      );
                    }).toList(),
                    selected: {_selectedFilter},
                    onSelectionChanged: (Set<String> selected) {
                      setState(() {
                        _selectedFilter = selected.first;
                        _loadLeaderboard();
                      });
                    },
                  ),
                ),
              ],
            ),
          ),

          // Top 3 Podium
          if (!_isLoading && _leaderboard.length >= 3)
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _PodiumCard(
                    entry: _leaderboard[1],
                    height: 120,
                    isCurrentUser: _leaderboard[1].userId == _currentUserId,
                  ),
                  _PodiumCard(
                    entry: _leaderboard[0],
                    height: 160,
                    isCurrentUser: _leaderboard[0].userId == _currentUserId,
                  ),
                  _PodiumCard(
                    entry: _leaderboard[2],
                    height: 100,
                    isCurrentUser: _leaderboard[2].userId == _currentUserId,
                  ),
                ],
              ),
            ),

          const Divider(),

          // Leaderboard List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _leaderboard.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.leaderboard_outlined,
                              size: 80,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Chưa có dữ liệu xếp hạng',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadLeaderboard,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _leaderboard.length,
                          itemBuilder: (context, index) {
                            final entry = _leaderboard[index];
                            final isCurrentUser = entry.userId == _currentUserId;
                            
                            return _LeaderboardCard(
                              entry: entry,
                              isCurrentUser: isCurrentUser,
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _PodiumCard extends StatelessWidget {
  final LeaderboardEntry entry;
  final double height;
  final bool isCurrentUser;

  const _PodiumCard({
    required this.entry,
    required this.height,
    required this.isCurrentUser,
  });

  Color _getRankColor(int rank) {
    switch (rank) {
      case 1:
        return Colors.amber;
      case 2:
        return Colors.grey.shade400;
      case 3:
        return Colors.brown.shade300;
      default:
        return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          alignment: Alignment.topCenter,
          children: [
            CircleAvatar(
              radius: 35,
              backgroundColor: _getRankColor(entry.rank),
              child: CircleAvatar(
                radius: 33,
                backgroundColor: Colors.white,
                child: Text(
                  entry.userName[0].toUpperCase(),
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: _getRankColor(entry.rank),
                  ),
                ),
              ),
            ),
            if (entry.rank <= 3)
              Positioned(
                top: -5,
                child: Icon(
                  Icons.emoji_events,
                  color: _getRankColor(entry.rank),
                  size: 24,
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: 100,
          child: Text(
            entry.userName,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.normal,
              color: isCurrentUser ? Theme.of(context).primaryColor : null,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 100,
          height: height,
          decoration: BoxDecoration(
            color: _getRankColor(entry.rank).withOpacity(0.3),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
            border: Border.all(
              color: isCurrentUser
                  ? Theme.of(context).primaryColor
                  : _getRankColor(entry.rank),
              width: isCurrentUser ? 3 : 2,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '${entry.rank}',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: _getRankColor(entry.rank),
                ),
              ),
              Text(
                '${entry.averageScore.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: _getRankColor(entry.rank),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LeaderboardCard extends StatelessWidget {
  final LeaderboardEntry entry;
  final bool isCurrentUser;

  const _LeaderboardCard({
    required this.entry,
    required this.isCurrentUser,
  });

  Color _getRankColor(int rank) {
    switch (rank) {
      case 1:
        return Colors.amber;
      case 2:
        return Colors.grey.shade400;
      case 3:
        return Colors.brown.shade300;
      default:
        return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isCurrentUser ? 4 : 1,
      color: isCurrentUser
          ? Theme.of(context).primaryColor.withOpacity(0.1)
          : null,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isCurrentUser
              ? Theme.of(context).primaryColor
              : Colors.transparent,
          width: 2,
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _getRankColor(entry.rank).withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${entry.rank}',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: _getRankColor(entry.rank),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            CircleAvatar(
              radius: 24,
              child: Text(
                entry.userName[0].toUpperCase(),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        title: Text(
          entry.userName,
          style: TextStyle(
            fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.w500,
          ),
        ),
        subtitle: Text('${entry.totalExams} bài thi'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${entry.averageScore.toStringAsFixed(1)}%',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: _getRankColor(entry.rank),
              ),
            ),
            Text(
              '${entry.totalScore} điểm',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LeaderboardEntry {
  final String userId;
  final String userName;
  final String? avatarUrl;
  final int totalScore;
  final int totalExams;
  final double averageScore;
  final int rank;

  LeaderboardEntry({
    required this.userId,
    required this.userName,
    this.avatarUrl,
    required this.totalScore,
    required this.totalExams,
    required this.averageScore,
    required this.rank,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['user_id'] as String,
      userName: json['user_name'] as String,
      avatarUrl: json['avatar_url'] as String?,
      totalScore: json['total_score'] as int,
      totalExams: json['total_exams'] as int,
      averageScore: (json['average_score'] as num).toDouble(),
      rank: json['rank'] as int,
    );
  }
}
