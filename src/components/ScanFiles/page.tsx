import React, { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open as fsOpen, stat } from "@tauri-apps/plugin-fs";
import { MusicFile } from "@/redux/modules/types";
import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
import { useAppDispatch } from "@/hooks/hooks";
import { List, message } from "antd";
import { setCurrentTrack,addTrackToPlaylist } from "@/redux/modules/musicPlayer/reducer";
import { Track } from "@/redux/modules/types";

// 类型增强
interface CachedTrack {
  url: string;
  lastAccessed: number;
}


const generateFileId = (path: string): number => {
  let hash = 0;
  const prime = 5381;
  
  for (let i = 0; i < path.length; i++) {
    hash = (hash * prime) ^ path.charCodeAt(i);
    hash = hash >>> 0; // 确保无符号32位整数
  }
  
  // 生成8位数字：取后8位并确保不为0开头
  return (hash % 90000000) + 10000000;
};



const MusicScan = () => {
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>(([]));
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  
  // 使用Ref缓存Blob URL并自动清理
  const blobCache = useRef<Map<string, CachedTrack>>(new Map());
  const cleanupTimer = useRef<NodeJS.Timeout>();

  // 自动清理过期的Blob URL
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [path, entry] of blobCache.current) {
        if (now - entry.lastAccessed > 60 * 60 * 1000) { // 1小时缓存
          URL.revokeObjectURL(entry.url);
          blobCache.current.delete(path);
        }
      }
    };
    
    cleanupTimer.current = setInterval(cleanup, 10 * 60 * 1000); // 每10分钟清理
    return () => clearInterval(cleanupTimer.current);
  }, []);

  const scanMusicDirectory = useCallback(async () => {
    try {
      setIsLoading(true);
      const selectedDirectory = await dialogOpen({
        directory: true,
      });

      if (!selectedDirectory) return;

      const musicPaths = (await invoke("scan_music_dir", {
        path: selectedDirectory,
      })) as string[];

      // 生成带唯一ID的文件列表
      const files: MusicFile[] = musicPaths
        .filter((path, index, self) => 
          self.findIndex(p => p === path) === index
        )
        .map(path => ({
          path,
          name: path.split(/[\\/]/).pop() || path,
          isPlaying: false,
          id: generateFileId(path) // 生成稳定ID
        }));

      setMusicFiles(files);
    } catch (error) {
      console.error("Error scanning music directory:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const convertToTrack = useCallback((music: MusicFile, url: string): Track => ({
    name: music.name,
    id: music.id,
    ar: ["本地歌手"],
    picUrl: "default-album-cover.jpg",
    url: url,
    duration: 0,
  }), []);

  const playMusic = useCallback(async (music: MusicFile) => {
    try {
      // 缓存检查
      if (blobCache.current.has(music.path)) {
        const cached = blobCache.current.get(music.path)!;
        cached.lastAccessed = Date.now();
        dispatch(setCurrentTrack(convertToTrack(music, cached.url)));
        return;
      }

      const fileInfo = await stat(music.path);
      if (fileInfo.size > 100 * 1024 * 1024) { // 100MB大小限制
        message.warning("文件过大，暂不支持播放");
        return;
      }

      const file = await fsOpen(music.path, { read: true });
      const buffer = new Uint8Array(fileInfo.size);
      await file.read(buffer);
      await file.close();

      const blob = new Blob([buffer], { type: "audio/*" }); // 更通用的类型
      const url = URL.createObjectURL(blob);
      
      // 更新缓存
      blobCache.current.set(music.path, {
        url,
        lastAccessed: Date.now()
      });
      const track:Track = convertToTrack(music, url)
      dispatch(setCurrentTrack(track));
      dispatch(addTrackToPlaylist({ from: "play", track: track }));
      setMusicFiles(prev => 
        prev.map(track => ({
          ...track,
          isPlaying: track.path === music.path
        }))
      );
    } catch (error) {
      console.error("Error playing music:", error);
      message.error("播放失败");
    }
  }, [dispatch, convertToTrack]);

  // 组件卸载时清理所有Blob URL
  useEffect(() => {
    return () => {
      blobCache.current.forEach(entry => URL.revokeObjectURL(entry.url));
      blobCache.current.clear();
    };
  }, []);

  return (
    <div
      className="p-4"
      style={{ overflow: "scroll", width: "100%", height: "30rem" }}
    >
      <h1 className="text-2xl font-bold mb-4 text-center">Local Music</h1>

      <div className="mb-4">
        <button
          onClick={scanMusicDirectory}
          className={`Lbutton h-12 flex items-center justify-center transition-all duration-300 hover:scale-105`}
          style={{margin:0,width: "100%"}}
        >
         <span>扫描音乐目录</span> 
        </button>
      </div>

      <List
        bordered
        size="small"
        loading={isLoading}
        dataSource={musicFiles}
        renderItem={(file) => (
          <List.Item
            key={file.path} // 使用唯一路径作为key
            style={{
              cursor: "pointer",
              color: "white",
            }}
            onClick={() => playMusic(file)}
          >
            <span>🎵 {file.name}</span>
          </List.Item>
        )}
      />
    </div>
  );
};

export default MusicScan;