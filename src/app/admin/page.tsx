"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { Upload, Music, Image as ImageIcon, Home, Database, Settings, Trash2, RefreshCw, Eye, AlertCircle, CheckCircle, Clock, Grid, Play } from "lucide-react";
import Link from "next/link";

const FileUpload = ({ label, icon, settingKey, onUploadSuccess }: { label: string, icon: React.ReactNode, settingKey: 'backgroundUrl' | 'musicUrl' | 'logoUrl', onUploadSuccess: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const validateFile = (file: File) => {
    const maxSize = settingKey === 'backgroundUrl' ? 50 * 1024 * 1024 : 
                   settingKey === 'logoUrl' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB video, 5MB logo, 10MB audio
    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize / (1024 * 1024)}MB`);
    }
    
    const allowedTypes = settingKey === 'backgroundUrl' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
      : settingKey === 'logoUrl'
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      : ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      try {
        validateFile(files[0]);
        setFile(files[0]);
        createPreview(files[0]);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };
  
  const createPreview = (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };
  
  const clearFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }
    
    try {
      validateFile(file);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unknown error');
      return;
    }
    
    console.log('Starting upload for file:', file.name, 'Type:', file.type, 'Size:', file.size);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 1. Get presigned URL from our API
      console.log('Step 1: Getting presigned URL...');
      const presignedResponse = await fetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileType: file.type,
          fileName: file.name 
        }),
      });
      
      console.log('Presigned response status:', presignedResponse.status);
      
      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        console.error('Presigned URL error:', errorData);
        throw new Error(errorData.message || "Failed to get upload URL.");
      }
      
      const { uploadUrl, publicUrl } = await presignedResponse.json();
      console.log('Got presigned URL, public URL will be:', publicUrl);
      setUploadProgress(30);

      // 2. Upload file directly to S3
      console.log('Step 2: Uploading to S3...');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
        mode: 'cors',
      });
      
      console.log('S3 upload response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('S3 upload error:', errorText);
        throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }
      
      console.log('S3 upload successful!');
      setUploadProgress(70);

      // 3. Save the public URL to our database
      console.log('Step 3: Saving to database...');
      const saveResponse = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingKey, value: publicUrl }),
      });
      
      console.log('Database save response status:', saveResponse.status);
      
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        console.error('Database save error:', errorData);
        throw new Error(errorData.message || "Failed to save setting.");
      }
      
      console.log('Upload process completed successfully!');
      setUploadProgress(100);
      toast.success(`${label} uploaded and saved successfully!`);
      
      // Refresh current settings
      setTimeout(() => {
        onUploadSuccess();
        setUploadProgress(0);
      }, 1000);
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (!uploadProgress || uploadProgress === 100) {
        clearFile();
        setTimeout(() => setUploadProgress(0), 2000);
      }
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center text-lg">{icon} {label}</Label>
      
      {/* Drag and Drop Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          type="file"
          accept={settingKey === 'backgroundUrl' ? 'image/*,video/*' : 
                 settingKey === 'logoUrl' ? 'image/*' : 'audio/*'}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              try {
                validateFile(e.target.files[0]);
                setFile(e.target.files[0]);
                createPreview(e.target.files[0]);
              } catch (error: unknown) {
                toast.error(error instanceof Error ? error.message : 'Unknown error');
              }
            }
          }}
          className="hidden"
          id={`file-${settingKey}`}
        />
        <label htmlFor={`file-${settingKey}`} className="cursor-pointer">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            {dragActive ? 'Drop file here' : 'Click to select or drag and drop'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {settingKey === 'backgroundUrl' ? 'Images/Videos up to 50MB' : 
             settingKey === 'logoUrl' ? 'Logo images up to 5MB' : 'Audio files up to 10MB'}
          </p>
        </label>
      </div>
      
      {/* Selected File Preview */}
      {file && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
            </div>
            <Button onClick={clearFile} variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Preview */}
          {previewUrl && (
            <div className="mb-3">
              {file.type.startsWith('image/') && (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded border"
                />
              )}
              {file.type.startsWith('video/') && (
                <video 
                  src={previewUrl} 
                  className="w-full h-32 object-cover rounded border"
                  controls
                  muted
                />
              )}
            </div>
          )}
          
          {file.type.startsWith('audio/') && (
            <div className="mb-3 p-4 border rounded bg-white flex items-center justify-center">
              <Music className="h-8 w-8 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Audio file selected</span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
              {isUploading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Uploading {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload to S3
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default function AdminDashboardPage() {
  const [currentSettings, setCurrentSettings] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ games: 0, questions: 0, globalQuestions: 0, activeGames: 0 });
  const [loading, setLoading] = useState(true);
  const [previewModal, setPreviewModal] = useState<{ type: 'image' | 'video' | 'audio', url: string } | null>(null);
  const [systemHealth, setSystemHealth] = useState({ status: 'checking', message: '' });
  const [mediaFiles, setMediaFiles] = useState<Array<{key: string, url: string, type: 'image' | 'video' | 'audio', size: number}>>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    fetchCurrentSettings();
    fetchStats();
    fetchMediaFiles();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setCurrentSettings(data);
      }
    } catch {
      console.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [gamesRes, questionsRes, healthRes] = await Promise.all([
        fetch('/api/admin/stats/games'),
        fetch('/api/admin/stats/questions'),
        fetch('/api/admin/test-aws')
      ]);
      
      const gamesData = gamesRes.ok ? await gamesRes.json() : { count: 0, active: 0 };
      const questionsData = questionsRes.ok ? await questionsRes.json() : { total: 0, global: 0 };
      const healthData = healthRes.ok ? await healthRes.json() : { success: false };
      
      setStats({
        games: gamesData.count || 0,
        questions: questionsData.total || 0,
        globalQuestions: questionsData.global || 0,
        activeGames: gamesData.active || 0
      });
      
      setSystemHealth({
        status: healthData.success ? 'healthy' : 'error',
        message: healthData.success ? 'All systems operational' : 'AWS connection issues'
      });
    } catch {
      console.error('Failed to fetch stats');
      setSystemHealth({ status: 'error', message: 'Failed to check system health' });
    }
  };

  const fetchMediaFiles = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const files = await res.json();
        setMediaFiles(files);
      }
    } catch {
      console.error('Failed to fetch media files');
    } finally {
      setLoadingMedia(false);
    }
  };

  const deleteMediaFile = async (key: string, url: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      
      if (res.ok) {
        setMediaFiles(prev => prev.filter(file => file.key !== key));
        
        if (currentSettings.backgroundUrl === url || currentSettings.musicUrl === url) {
          const settingKey = currentSettings.backgroundUrl === url ? 'backgroundUrl' : 'musicUrl';
          await clearSetting(settingKey);
        }
        
        toast.success('File deleted successfully!');
      } else {
        toast.error('Failed to delete file.');
      }
    } catch (error) {
      toast.error('Failed to delete file.');
    }
  };

  const setAsActive = async (url: string, type: 'image' | 'video' | 'audio') => {
    const settingKey = type === 'audio' ? 'musicUrl' : 'backgroundUrl';
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingKey, value: url }),
      });
      
      if (res.ok) {
        setCurrentSettings((prev) => ({ ...prev, [settingKey]: url }));
        toast.success(`Set as active ${type === 'audio' ? 'music' : 'background'}!`);
      }
    } catch (error) {
      toast.error('Failed to set as active.');
    }
  };

  const clearSetting = async (key: string) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: '' }),
      });
      if (res.ok) {
        setCurrentSettings((prev) => ({ ...prev, [key]: '' }));
        toast.success(`${key} cleared successfully!`);
      }
    } catch (error) {
      toast.error('Failed to clear setting.');
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setCurrentSettings((prev) => ({ ...prev, [key]: value }));
        toast.success(`${key} updated successfully!`);
      }
    } catch (error) {
      toast.error('Failed to update setting.');
    }
  };

  return (
    <>
      <Toaster richColors />
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage global settings and monitor system status</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/badges">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Badge Management
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline">
                <Database className="mr-2 h-4 w-4" />
                User Management
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline">
                <Grid className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Link href="/admin/moderation">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Content Moderation
              </Button>
            </Link>
            <Link href="/admin/review-queue">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Review Queue
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* System Health Alert */}
        {systemHealth.status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{systemHealth.message}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Games</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.games}</div>
              <p className="text-xs text-muted-foreground">Games created</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.questions}</div>
              <p className="text-xs text-muted-foreground">Questions in database</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Global Questions</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.globalQuestions}</div>
              <p className="text-xs text-muted-foreground">Available for import</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              {systemHealth.status === 'healthy' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemHealth.status === 'healthy' ? 'Online' : 'Issues'}
              </div>
              <p className="text-xs text-muted-foreground">{systemHealth.message}</p>
            </CardContent>
          </Card>
        </div>

        {/* Points Economy Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Points Economy Settings</CardTitle>
            <CardDescription>Configure point caps and anti-farming measures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="dailyPointCap">Daily Point Cap</Label>
                <Input
                  id="dailyPointCap"
                  type="number"
                  placeholder="1000"
                  value={currentSettings.dailyPointCap || '1000'}
                  onChange={(e) => setCurrentSettings(prev => ({ ...prev, dailyPointCap: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Maximum points per user per day</p>
              </div>

              <div>
                <Label htmlFor="weeklyPointCap">Weekly Point Cap</Label>
                <Input
                  id="weeklyPointCap"
                  type="number"
                  placeholder="5000"
                  value={currentSettings.weeklyPointCap || '5000'}
                  onChange={(e) => setCurrentSettings(prev => ({ ...prev, weeklyPointCap: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Maximum points per user per week</p>
              </div>

              <div>
                <Label htmlFor="minPlayersForHostPoints">Min Players for Host Points</Label>
                <Input
                  id="minPlayersForHostPoints"
                  type="number"
                  placeholder="3"
                  value={currentSettings.minPlayersForHostPoints || '3'}
                  onChange={(e) => setCurrentSettings(prev => ({ ...prev, minPlayersForHostPoints: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum players required for host to earn points</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => updateSetting('dailyPointCap', currentSettings.dailyPointCap || '1000')}
                size="sm"
              >
                Save Daily Cap
              </Button>
              <Button
                onClick={() => updateSetting('weeklyPointCap', currentSettings.weeklyPointCap || '5000')}
                size="sm"
              >
                Save Weekly Cap
              </Button>
              <Button
                onClick={() => updateSetting('minPlayersForHostPoints', currentSettings.minPlayersForHostPoints || '3')}
                size="sm"
              >
                Save Min Players
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media Files</CardTitle>
              <CardDescription>Upload background images/videos and music files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUpload
                label="Background Image / Video"
                icon={<ImageIcon className="mr-2" />}
                settingKey="backgroundUrl"
                onUploadSuccess={() => {
                  fetchCurrentSettings();
                  fetchMediaFiles();
                }}
              />
              <FileUpload
                label="Background Music (MP3)"
                icon={<Music className="mr-2" />}
                settingKey="musicUrl"
                onUploadSuccess={() => {
                  fetchCurrentSettings();
                  fetchMediaFiles();
                }}
              />
              <FileUpload
                label="Logo Image"
                icon={<ImageIcon className="mr-2" />}
                settingKey="logoUrl"
                onUploadSuccess={() => {
                  fetchCurrentSettings();
                  fetchMediaFiles();
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Settings</CardTitle>
                  <CardDescription>View and manage active global settings</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchCurrentSettings}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Loading settings...</p>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">Background Media</p>
                        {currentSettings.backgroundUrl && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => clearSetting('backgroundUrl')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {currentSettings.backgroundUrl ? (
                        <div className="space-y-2">
                          <div className="relative w-full h-32 bg-gray-100 rounded overflow-hidden group">
                            {currentSettings.backgroundUrl.match(/\.(mp4|webm|mov)$/i) ? (
                              <video 
                                src={currentSettings.backgroundUrl} 
                                className="w-full h-full object-cover"
                                muted
                                loop
                                autoPlay
                              />
                            ) : (
                              <img 
                                src={currentSettings.backgroundUrl} 
                                alt="Background preview" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextSibling) nextSibling.style.display = 'flex';
                                }}
                              />
                            )}
                            <div className="hidden w-full h-full items-center justify-center text-gray-500">
                              Preview not available
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setPreviewModal({
                                type: currentSettings.backgroundUrl.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
                                url: currentSettings.backgroundUrl
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {currentSettings.backgroundUrl}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No background set</p>
                      )}
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">Background Music</p>
                        {currentSettings.musicUrl && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => clearSetting('musicUrl')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {currentSettings.musicUrl ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <audio 
                              src={currentSettings.musicUrl} 
                              controls 
                              className="flex-1 h-8"
                              style={{ height: '32px' }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewModal({ type: 'audio', url: currentSettings.musicUrl })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {currentSettings.musicUrl}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No music set</p>
                      )}
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium">Logo</p>
                        {currentSettings.logoUrl && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => clearSetting('logoUrl')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {currentSettings.logoUrl ? (
                        <div className="space-y-2">
                          <div className="relative w-full h-20 bg-gray-100 rounded overflow-hidden group flex items-center justify-center">
                            <img 
                              src={currentSettings.logoUrl} 
                              alt="Logo preview" 
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextSibling) nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-full h-full items-center justify-center text-gray-500">
                              Preview not available
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setPreviewModal({ type: 'image', url: currentSettings.logoUrl })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {currentSettings.logoUrl}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No logo set</p>
                      )}
                    </div>
                  </div>
                  
                  {!currentSettings.backgroundUrl && !currentSettings.musicUrl && !currentSettings.logoUrl && (
                    <p className="text-center text-muted-foreground py-4">
                      No global settings configured yet.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="xl:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Media Gallery</CardTitle>
                  <CardDescription>All uploaded files from S3</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchMediaFiles}
                  disabled={loadingMedia}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingMedia ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMedia ? (
                <div className="text-center py-8">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading media files...</p>
                </div>
              ) : mediaFiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {mediaFiles.map((file) => {
                    const isActive = currentSettings.backgroundUrl === file.url || currentSettings.musicUrl === file.url;
                    return (
                      <div key={file.key} className={`relative group border rounded-lg overflow-hidden ${
                        isActive ? 'ring-2 ring-primary' : ''
                      }`}>
                        {file.type === 'image' && (
                          <img 
                            src={file.url} 
                            alt="Media" 
                            className="w-full h-20 object-cover"
                          />
                        )}
                        {file.type === 'video' && (
                          <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                            <Play className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        {file.type === 'audio' && (
                          <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                            <Music className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        
                        {isActive && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
                            Active
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewModal({ type: file.type, url: file.url })}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {!isActive && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setAsActive(file.url, file.type)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMediaFile(file.key, file.url)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="p-2 bg-white">
                          <p className="text-xs text-muted-foreground truncate">
                            {file.key?.split('/').pop()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Grid className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No media files found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Preview Modal */}
        {previewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">Media Preview</h3>
                <Button variant="ghost" onClick={() => setPreviewModal(null)}>
                  ×
                </Button>
              </div>
              <div className="p-4">
                {previewModal.type === 'image' && (
                  <img src={previewModal.url} alt="Preview" className="max-w-full h-auto" />
                )}
                {previewModal.type === 'video' && (
                  <video src={previewModal.url} controls className="max-w-full h-auto" />
                )}
                {previewModal.type === 'audio' && (
                  <div className="text-center py-8">
                    <Music className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <audio src={previewModal.url} controls className="w-full max-w-md" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}