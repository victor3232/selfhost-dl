const axios = require("axios");
const cheerio = require("cheerio");

class FacebookDownloader {
    constructor(url) {
        this.url = url;
    }

    async download() {
        try {
            const results = await this.getFacebookData(this.url);
            if (!results || !results.downloads || results.downloads.length === 0) {
                throw new Error("Tidak ada media ditemukan");
            }
            return results;
        } catch (error) {
            throw new Error('Gagal mengunduh dari Facebook: ' + error.message);
        }
    }

    async getFacebookData(url) {
        try {
            const { data } = await axios.post(
                "https://getmyfb.com/process",
                `id=${encodeURIComponent(url)}&locale=id`,
                {
                    headers: {
                        "HX-Request": true,
                        "HX-Trigger": "form",
                        "HX-Target": "target",
                        "HX-Current-URL": "https://getmyfb.com/id",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
                        Referer: "https://getmyfb.com/id",
                    },
                }
            );

            const $ = cheerio.load(data);
            const downloads = [];

            $(".results-list li").each(function() {
                const downloadLink = $(this).find("a").attr("href");
                const quality = $(this).text().trim().split("(")[0].trim();
                
                if (downloadLink) {
                    downloads.push({
                        type: 'video_hd',
                        url: downloadLink,
                        quality: quality,
                        filename: `facebook_${quality}_${Date.now()}.mp4`
                    });
                }
            });

            if (downloads.length === 0) {
                throw new Error("Tidak dapat menemukan link download");
            }

            const caption = $(".results-item-text").text().trim();
            const imageUrl = $(".results-item-image").attr("src");

            return {
                platform: 'facebook',
                metadata: {
                    title: caption || 'Facebook Video',
                    thumbnail: imageUrl || '',
                    author: {
                        name: 'Facebook User'
                    }
                },
                downloads: downloads
            };

        } catch (error) {
            console.error("Facebook Scraping Error:", error);
            throw new Error(error.message || "Gagal mengambil data dari Facebook");
        }
    }
}

module.exports = FacebookDownloader;