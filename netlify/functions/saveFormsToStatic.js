const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Function to calculate cosine similarity between two strings //diubah
const cosineSimilarity = (str1, str2) => { //diubah
  const getTermFrequency = (str) => { //diubah
    const words = str.split(/\s+/); //diubah
    const termFreq = {}; //diubah
    words.forEach(word => { //diubah
      termFreq[word] = (termFreq[word] || 0) + 1; //diubah
    }); //diubah
    return termFreq; //diubah
  }; //diubah

  const termFreqA = getTermFrequency(str1); //diubah
  const termFreqB = getTermFrequency(str2); //diubah

  const terms = new Set([...Object.keys(termFreqA), ...Object.keys(termFreqB)]); //diubah

  let dotProduct = 0; //diubah
  let magA = 0; //diubah
  let magB = 0; //diubah

  terms.forEach(term => { //diubah
    const a = termFreqA[term] || 0; //diubah
    const b = termFreqB[term] || 0; //diubah
    dotProduct += a * b; //diubah
    magA += a * a; //diubah
    magB += b * b; //diubah
  }); //diubah

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB)); //diubah
}; //diubah

exports.handler = async (event) => {
  try {
    // Ambil environment variables
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
    const STATIC_DIR = "static"; // Direktori target di GitHub

    //jobsus addition:
    const FORM_ID = process.env.FORM_ID_postForm;

    // Ambil nilai RECREATE dari query parameter
    const params = new URLSearchParams(event.queryStringParameters);
    const RECREATE = params.get('RECREATE') === 'true';

    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO) {
      throw new Error(
        "Environment variables NET_TOKEN, GITHUB_TOKEN, or REPO are missing"
      );
    }

    const formId = FORM_ID;
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;

    // Step 1: Fetch submissions dari Netlify
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to fetch form submissions" }),
      };
    }

    const submissions = await response.json();

    // Step 2: Buat direktori sementara di /tmp
    const tmpPath = path.join("/tmp", "static");
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath, { recursive: true });
    }

    // Step 3: Tulis file sementara
    submissions.forEach((submission, index) => {
      const { 
        title,
        slug, 
        tags, 
        category, 
        bodypost, 
        author, 
        imagefile, 
        ip, 
        user_agent, 
        referrer 
      } = submission.data;

      // Properti tambahan dari submission di luar data
      const createdAt = submission.created_at || new Date().toISOString();
      const imageFileUrl = imagefile?.url || "No image URL";

      // Fungsi untuk membersihkan bodypost
      const cleanText = (text) => {
        if (!text) return "";
        return text
          .replace(/<[^>]*>/g, "") // Hapus semua HTML tags
          .replace(/[^\x20-\x7E]/g, ""); // Hapus semua simbol non-ASCII
      };

      const cleanedBody = cleanText(bodypost); // Membersihkan bodypost
      const truncateToWords = (text, maxLength) => {
        if (!text) return "";
        const words = text.split(/\s+/); // Pecah teks berdasarkan spasi
        let truncated = "";
        for (const word of words) {
          if ((truncated + word).length > maxLength) break;
          truncated += (truncated ? " " : "") + word;
        }
        return truncated;
      };

      const metaDescription = truncateToWords(cleanedBody, 155) || "No bodypost content available";

      const safeTitle = title || `Submission ${index + 1}`;
      const imageFileName = safeTitle || metaDescription;

      // Find the 3 most similar 'bodypost' columns and get their slugs and titles
      const similarPosts = submissions
        .filter(sub => sub.data.bodypost !== bodypost)
        .map(sub => ({ slug: sub.data.slug, title: sub.data.title, similarity: cosineSimilarity(bodypost, sub.data.bodypost) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3); //diubah

      const relatedPostsHtml = similarPosts.map(post => `<a href="/static/${post.slug}">${post.title}</a>`).join("<br>"); //diubah

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" id="meta-description" content="${metaDescription || "No meta description"}">
  <meta name="author" id="meta-author" content="${author || "Unknown"}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${metaDescription || "No og description"}">
  <meta property="og:image" content="${imageFileUrl}">
  <meta property="og:url" content="${referrer || "Unknown"}">

  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${metaDescription || "No twitter description"}">
  <meta name="twitter:image" content="${imageFileUrl}">
  <meta name="twitter:card" content="summary_large_image">
  
  <link rel="dns-prefetch" href="https://res.cloudinary.com">
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/rss.xml">
  <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">

  <title id="page-title">${safeTitle}</title>

  <!-- JSON-LD schema -->
  <script type="application/ld+json" id="json-ld-schema">
  ${JSON.stringify({
    "@context": "http://schema.org",
    "@type": "Article",
    "headline": safeTitle,
    "author": {
      "@type": "Person",
      "name": author || "Unknown"
    },
    "datePublished": createdAt,
    "articleBody": metaDescription || "no article body text ",
    "keywords": tags || "",
    "image": imageFileUrl
  }, null, 2)}
  </script>
  <link rel="stylesheet" href="/post-html.css">
  <script src="/post-html-main.js"></script>
</head>
<body>

  <div class="container" style="min-height: 1300px;"  itemscope itemtype="http://schema.org/Article" >
    <header>
      <nav class="menu">
        <a href="/">Home</a> | 
        <a href="#search_input" onclick="focusSearchInput()">Search</a>
      </nav>
  
      <!-- Post Title -->
        <h1 class="post-title" style="" itemprop="headline">
          <span id="post-title">${safeTitle}</span>
        </h1>
    </header>

    <!-- Post Meta (akan ditampilkan setelah post-title muncul) -->
    <div id="post-meta" class="post-meta" style="">
      <div itemprop="author" itemscope itemtype="http://schema.org/Person">
        <span id="post-author" itemprop="name">${author || "Unknown Author"}</span>
      </div>
      <span id="post-category">Category :${category || "Uncategorized"}</span> <span id="post-tags">Tags: ${tags || "No tags"}</span> <time itemprop="datePublished" datetime="${new Date(createdAt).toISOString()}">${new Date(createdAt).toLocaleDateString()}</time>
    </div><!-- class post-meta ditutup -->

    <!-- Container for post content -->
    <div id="post-container" class="post-container">
        <figure>
            <img itemprop="image" id="post-image" class="post-image" alt="${imageFileName}" style="top: 40%;" src="${imageFileUrl}"  />
            <!-- URL: <a href="${imageFileUrl}" target="_blank">${imageFileUrl}</a -->
        </figure>

        <!-- post-body yang akan ditampilkan setelah gambar selesai dimuat -->
        <div id="post-body" class="post-body" style="" itemprop="articleBody">${bodypost || "No bodypost content"}
        </div><!-- class post-body ditutup -->

        <div id="relatedPostBody" class="relatedPostBody">Related Articles :<br>
          ${relatedPostsHtml} <!-- diubah -->
        </div>
          <!-- start of  Comment Section -->
            <br><br>
              <div id="comment_thread"></div>
          <!-- end of  Comment Section -->

          <script>
            createSearchForm();

            // Memanggil loadCusdis setelah halaman sepenuhnya dimuat
            window.addEventListener('load', loadCusdis);
          </script>
        </div><!-- class post-body ditutup -->
      <br><br><br><br>
            <!-- p>IP: ${ip || "Unknown IP"} | UA: ${user_agent || "Unknown UA"} | Ref: ${referrer || "Unknown Ref"}</p -->   
      <br>
    </div><!-- class post-container ditutup -->
    
    <!-- Placeholder untuk Footer -->
    <div id="footer-placeholder" class="footer-placeholder"></div>

    <footer>
    <nav class="footer-menu">
    <a href="/">Home</a>
    <a href="/privacy">Privacy</a>
    <a href="/about">About</a>
    <a href="/tos">ToS</a>
    <a href="/login/">Login</a>
    <a href="/rssfeed.xml">RSS Single</a>
    <a href="/rss.xml">RSS Multi</a>
    <a href="/sitemap.html">HTML Sitemap</a>
    <a href="/sitemap.xml">XML Sitemap</a>

    </nav>
    <br>
    <p>&copy; 2024 <a href="/">Post Netlify</a>. All rights reserved.</p>
    </footer>

  </div><!-- class container ditutup -->

  <script src="/constanta.js" defer></script>
  <script>
    //Debugging akan muncul hanya jika Anda menambahkan ?debug=true ke URL, misalnya:
    //https://example.com/about.html?debug=true.
    if (window.location.search.includes('debug=true')) {
      document.getElementById('debug-info').classList.remove('debug-hidden');
    }
  </script>
</body>
</html>
`;

      const fileName = `${submission.data.slug || `submission-${index + 1}`}.html`;
      const filePath = path.join(tmpPath, fileName);

      fs.writeFileSync(filePath, htmlContent, "utf8");
      console.log(`File saved: ${filePath}`);
    });

    // Step 4: Upload file ke GitHub
    const fileList = fs.readdirSync(tmpPath);
    const report = []; // Array untuk menyimpan laporan status file

    for (const fileName of fileList) {
      const filePath = path.join(tmpPath, fileName);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const encodedContent = Buffer.from(fileContent).toString("base64");

      const githubApiUrl = `https://api.github.com/repos/${REPO}/contents/${STATIC_DIR}/${fileName}`;

      // Check if file already exists
      let sha = null;

      try {
        const fileCheckResponse = await axios.get(githubApiUrl, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        });
        sha = fileCheckResponse.data.sha;

        // Jika RECREATE adalah false, hanya update jika konten berbeda
        if (!RECREATE) {
          const existingContent = fileCheckResponse.data.content;
          const decodedContent = Buffer.from(existingContent, "base64").toString("utf8");
          if (decodedContent === fileContent) {
            console.log(`${fileName} is already up-to-date. Skipping upload.`);
            report.push({ file: fileName, status: "skipped",
                   time: new Date().toLocaleString()  
                   });
            continue;
          }
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`${fileName} does not exist, creating a new file.`);
        } else {
          throw new Error(`Error checking file: ${error.message}`);
        }
      }

      // Upload or update the file
      await axios.put(
        githubApiUrl,
        {
          message: `Create/Update ${fileName}`,
          content: encodedContent,
          sha: sha || undefined, // Sertakan SHA jika file ada
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      console.log(`${fileName} uploaded successfully.`);
      report.push({ file: fileName, 
                   status: sha ? "updated" : "created",
                   time: new Date().toLocaleString()  
                  });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files uploaded successfully to GitHub!",
        report: report,
      }, null, 2),
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }, null, 2),
    };
  }
};
