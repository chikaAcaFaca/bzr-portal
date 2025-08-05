import { Client } from "basic-ftp";

async function uploadFiles() {
    const client = new Client();
    client.ftp.verbose = true
    client.ftp.secure = false
    try {
        await client.access({
            host: process.env.FTP_HOST || "your-ftp-host",
            user: process.env.FTP_USER || "your-ftp-username",
            password: process.env.FTP_PASSWORD || "your-ftp-password",
            secure: false,
        });
        await client.ensureDir("/public_html");
        await client.clearWorkingDir();
        await client.uploadFromDir("./dist"); // or the path to your build directory
        console.log("Upload successful!");
    } catch (err) {
        console.error(err);
    } finally {
        client.close();
    }
}

uploadFiles();