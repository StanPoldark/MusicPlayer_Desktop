import { getSongUrls } from "@/app/api/music";
import {
  Track,
  AudioResponse
} from "@/redux/modules/types";

// 获取歌曲的 URL
 const proxySongWithUrl = async (track: Track) => {
    // 调用 Tauri 后端代理音频请求
    const { invoke } = await import("@tauri-apps/api/core");

    // 获取音频数据
    const response = await invoke<AudioResponse>("proxy_audio", {
      url: track.url,
    });

    // 验证响应
    if (!response.data || response.data.length === 0) {
      throw new Error("Invalid audio data received");
    }

    // 将数字数组转换为 Uint8Array
    const uint8Array = new Uint8Array(response.data);

    // 创建 Blob
    const blob = new Blob([uint8Array], {
      type: response.content_type || "audio/mpeg",
    });

    // 创建 Blob URL
    const url = URL.createObjectURL(blob);

    return url;
  };


  const DownloadAudio = async (audioInfo: any) => {
  const audioId = audioInfo.id;

  // 检查 audioId 的有效性
  if (typeof audioId === "number" && audioId > 0) {
        var url = await proxySongWithUrl(audioInfo);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${audioInfo.name}.mp3`; // 文件名格式
        a.click(); // 自动触发下载
        window.URL.revokeObjectURL(url); // 释放 URL 对象

  } else {
    console.error("Invalid audioId provided:", audioId);
  }
}
export default DownloadAudio;
