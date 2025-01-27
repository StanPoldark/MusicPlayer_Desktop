import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, stat } from "@tauri-apps/plugin-fs";
import { MusicFile } from "@/redux/modules/types";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useAppDispatch } from "@/hooks/hooks";
import { List } from "antd";
import "@/components/Login/index.scss";
import {
  setCurrentTrack,
  addTrackToPlaylist,
} from "@/redux/modules/musicPlayer/reducer";

import { Track } from "@/redux/modules/types";

const MusicScan = () => {
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const dispatch = useAppDispatch();
  const scanMusicDirectory = async () => {
    try {
      // 打开文件夹选择对话框
      const selectedDirectory = await openDialog({
        directory: true, // 允许选择文件夹
      });

      // 如果没有选择文件夹，则返回
      if (!selectedDirectory) return;

      // 获取目录下的所有音乐文件路径
      const musicPaths = (await invoke("scan_music_dir", {
        path: selectedDirectory,
      })) as string[];

      const files: MusicFile[] = musicPaths.map((path) => ({
        path,
        name: path.split("/").pop() || path,
        isPlaying: false,
      }));

      setMusicFiles(files);
    } catch (error) {
      console.error("Error scanning music directory:", error);
    }
  };

  const convertToTrack = (music: MusicFile, url: string): Track => {
    const fileName = music.path.split("\\").pop() || "";
    return {
      name: fileName,
      id: null, // 使用随机字符串作为唯一 ID
      ar: [], // 假设没有艺术家信息，设置为空数组
      picUrl: "", // 假设没有专辑封面 URL，设置为空字符串
      url: url,
    };
  };

  const playMusic = async (music: MusicFile) => {
    try {
      // 获取文件信息
      const fileInfo = await stat(music.path);
      const fileSize = fileInfo.size;

      // 打开文件
      const file = await open(music.path, { read: true });

      // 创建缓冲区并读取文件
      const buffer = new Uint8Array(fileSize);
      await file.read(buffer);
      await file.close();

      // 创建 Blob URL
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const track = convertToTrack(music, url);
      console.log(track);

      dispatch(setCurrentTrack(track));

      // 更新状态
      setMusicFiles((prev) =>
        prev.map((track) => ({
          ...track,
          isPlaying: track.path === music.path,
        }))
      );
    } catch (error) {
      console.error("Error playing music:", error);
    }
  };

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
          扫描音乐目录
        </button>
      </div>

      <List bordered size="small">
        {musicFiles.map((file, index) => (
          <List.Item
            key={index}
            style={{
              cursor: "pointer",
              color: "white",
            }}
            onClick={() => playMusic(file)}
          >
            <span>{file.path.split("\\").pop() || ""}</span>
          </List.Item>
        ))}
      </List>
    </div>
  );
};

export default MusicScan;
