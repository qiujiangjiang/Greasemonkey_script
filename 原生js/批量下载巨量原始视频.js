// 示例输入，你可以替换为从其他地方复制来的实际数据
const input = `video1.mp4,https://example.com/video1.mp4
video2.mp4,https://example.com/video2.mp4`;

// 按行分割输入内容
const lines = input.split('\n');

// 遍历每一行
lines.forEach((line) => {
    // 按逗号分割每行，获取下载名和链接
    const [fileName, videoUrl] = line.split(',');

    if (fileName && videoUrl) {
        // 发起请求获取视频的二进制数据
        fetch(videoUrl)
          .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.blob();
            })
          .then(blob => {
                // 创建一个临时的下载链接
                const url = URL.createObjectURL(blob);
                // 创建一个 <a> 元素
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                // 模拟点击 <a> 元素来触发下载
                a.click();
                // 释放临时的下载链接
                URL.revokeObjectURL(url);
            })
          .catch(error => {
                console.error(`下载 ${fileName} 时出错:`, error);
            });
    }
});
