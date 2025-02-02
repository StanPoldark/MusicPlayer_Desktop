# Simple Music Player  

A simple music player desktop application built with **Next.js 15** and **React 18** and **Tauri**. 
### Frontend Design Inspiration  

The frontend styling is inspired by Bilibili content creator **青夏家的Ela**. Check out their project here: [React-Small-Music-Player](https://github.com/QingXia-Ela/React-Small-Music-Player).  

### Backend API  

The backend uses the [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) to fetch music data.  


## Getting Started  

To start the development server:  

```bash  
cd music-player  
npm install  
npm run build
```

Ensure you have Rust and Tauri CLI installed:

```bash  
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Install Tauri CLI
cargo install tauri-cli
```

Run the application in Tauri:

```bash  
npm run tauri dev
```

Build an exe file:

```bash  
npm run tauri build
```

Replace baseURL with your own server URL in `src/app/api/axiosConfig.js`.

## Tips:
Currently, only QR code login is supported. The button for captcha login is hidden due to recent changes in the NetEase Cloud Music API, which enforces additional security checks for non-secure login methods.

## Future Enhancements:

Expanding functionalities based on the API.
~~Creating a PC client using Tauri to support local music playback.
Developing a mobile version for better accessibility.
