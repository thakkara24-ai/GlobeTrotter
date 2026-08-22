import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { communityService } from '../../services/communityService';
import { CommunityPost } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { Skeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import { Users, Heart, Plus, MapPin, Search } from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Create Post Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postDestination, setPostDestination] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await communityService.getPosts({ search: search.trim() || undefined });
      setPosts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load community experiences');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      showToast('info', 'Please log in to like community stories.');
      return;
    }
    try {
      await communityService.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === postId) {
            const hasLiked = p.likes.includes(user?._id || '');
            const newLikes = hasLiked
              ? p.likes.filter((id) => id !== user?._id)
              : [...p.likes, user?._id || ''];
            return { ...p, likes: newLikes };
          }
          return p;
        })
      );
    } catch {
      showToast('error', 'Failed to update like');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postContent || !postDestination) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await communityService.createPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        destination: postDestination.trim(),
        images: postImageUrl ? [postImageUrl] : [],
        tags: [postDestination.split(',')[0].trim(), 'TravelExperience'],
      });

      setPosts((prev) => [created, ...prev]);
      showToast('success', 'Travel experience shared with community!');
      setIsCreateOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostDestination('');
      setPostImageUrl('');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E1E4] shadow-soft">
        <div>
          <h1 className="text-3xl font-display font-black text-[#2F2930] tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F4EEF3] text-[#714B67] flex items-center justify-center border border-[#E5E1E4] shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            Traveler Community
          </h1>
          <p className="text-sm text-[#6F6A70] mt-1 font-medium">
            Real stories, itineraries, and recommendations shared by passionate GlobeTrotters.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            if (!isAuthenticated) {
              showToast('info', 'Please log in to share your travel story.');
              return;
            }
            setIsCreateOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Share Story
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E1E4] shadow-soft">
        <Input
          placeholder="Search community stories by destination or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-[#6F6A70]" />}
        />
      </div>

      {/* Posts Feed */}
      {error ? (
        <ErrorState message={error} onRetry={fetchPosts} />
      ) : isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[#6F6A70] bg-white rounded-2xl border border-dashed border-[#E5E1E4] space-y-2 font-medium">
          <p className="text-sm font-semibold">No community stories found.</p>
          <p className="text-xs">Be the first to share an inspiring travel experience!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const hasLiked = user && post.likes?.includes(user._id);
            return (
              <div
                key={post._id}
                className="bg-white rounded-2xl border border-[#E5E1E4] shadow-soft overflow-hidden p-5 sm:p-7 space-y-4 hover:border-[#714B67]/40 transition-all"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <InitialsAvatar name={post.userId?.name || 'User'} avatar={post.userId?.avatar} size="md" className="ring-1 ring-[#E5E1E4]" />
                    <div>
                      <h4 className="text-sm font-bold text-[#2F2930] font-display">{post.userId?.name}</h4>
                      <p className="text-[11px] text-[#6F6A70] font-medium">
                        {formatDate(post.createdAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <Badge variant="teal" size="sm" className="flex items-center gap-1 font-bold">
                    <MapPin className="w-3 h-3 text-[#017E84]" />
                    {post.destination}
                  </Badge>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-display font-bold text-[#2F2930] leading-snug">{post.title}</h3>
                  <p className="text-xs sm:text-sm text-[#6F6A70] leading-relaxed whitespace-pre-line font-medium">
                    {post.content}
                  </p>
                </div>

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl overflow-hidden max-h-80">
                    {post.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="Post attachment"
                        className="w-full h-52 object-cover rounded-xl ring-1 ring-[#E5E1E4]"
                      />
                    ))}
                  </div>
                )}

                {/* Tags & Likes Footer */}
                <div className="pt-3 border-t border-[#E5E1E4] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.tags?.map((t) => (
                      <span key={t} className="text-xs text-[#714B67] bg-[#F4EEF3] px-2 py-0.5 rounded-md font-semibold border border-[#E5E1E4]">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      hasLiked
                        ? 'bg-[#F9EFEF] text-[#B85C5C] border border-[#F0D1D1]'
                        : 'bg-[#F7F7F6] text-[#6F6A70] hover:bg-[#F9EFEF] hover:text-[#B85C5C] border border-[#E5E1E4]'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-[#B85C5C] text-[#B85C5C]' : ''}`} />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Experience Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Share Your Travel Experience"
        description="Inspire fellow travelers with reviews, tips, and hidden gems."
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <Input
            label="Story Title"
            placeholder="e.g. 3 Days in Udaipur: Hidden Sunset Spots & Street Food"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            required
          />

          <Input
            label="Destination"
            placeholder="e.g. Udaipur, Rajasthan"
            value={postDestination}
            onChange={(e) => setPostDestination(e.target.value)}
            required
          />

          <Input
            label="Optional Image URL"
            placeholder="https://images.unsplash.com/..."
            value={postImageUrl}
            onChange={(e) => setPostImageUrl(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-[#2F2930] mb-1.5 font-display">
              Your Travel Story & Recommendations
            </label>
            <textarea
              rows={4}
              className="w-full rounded-xl border border-[#E5E1E4] bg-white px-3 py-2 text-sm text-[#2F2930] placeholder-[#6F6A70]/60 focus:border-[#714B67] focus:outline-none focus:ring-1 focus:ring-[#714B67] font-medium"
              placeholder="What made this trip memorable? Tips on bookings, timings, and must-eat delicacies..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-[#E5E1E4]">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Publish Story
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
