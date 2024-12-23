const fetch = require("node-fetch");

exports.handler = async () => {
  try {
    // Environment variables
    const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.REPO;
            //jobsus addition:
    const FORM_ID = process.env.FORM_ID_postForm;
    const FILE_PATH = "index-static.html"; // Path untuk file di GitHub root , tidak berlaku untuk multi page index


    const NETLIFY_ENDPOINT = `https://api.netlify.com/api/v1/forms/${FORM_ID}/submissions`;

    const author = "Default Author"; // Atur nilai default jika tidak ada
    const title = "Default Title"; // Atur nilai default jika tidak ada
    const snippet = "Default Snippet";





    
    let sha = null; // Tambahkan sebelum penggunaan
 // Log environment variables dan FORM_ID
    console.log("Netlify Access Token:", NETLIFY_ACCESS_TOKEN);
    console.log("GitHub Token:", GITHUB_TOKEN);
    console.log("Repo:", REPO);
    console.log("Form ID:", FORM_ID);
    console.log("Netlify Endpoint:", endpoint);


    
    
    if (!NETLIFY_ACCESS_TOKEN || !GITHUB_TOKEN || !REPO) {
      console.error("Missing environment variables:", {
        NETLIFY_ACCESS_TOKEN: !!NETLIFY_ACCESS_TOKEN,
        GITHUB_TOKEN: !!GITHUB_TOKEN,
        REPO: !!REPO,
      });
      throw new Error("Missing required environment variables");
    }

    // Fetch submissions from Netlify Forms
    const netlifyResponse = await fetch(NETLIFY_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!netlifyResponse.ok) {
      console.error("Netlify API error:", {
        status: netlifyResponse.status,
        statusText: netlifyResponse.statusText,
        url: NETLIFY_ENDPOINT,
      });
      return {
        statusCode: netlifyResponse.status,
        body: JSON.stringify({ error: "Failed to fetch form submissions" }),
      };
    }

    const submissions = await netlifyResponse.json();

    if (!Array.isArray(submissions) || submissions.length === 0) {
      console.warn("Submissions are empty or invalid:", submissions);
      return {
        statusCode: 204,
        body: JSON.stringify({ message: "No submissions found." }),
      };
    }

    const validSubmissions = submissions.filter(submission => submission && submission.data);
    if (validSubmissions.length === 0) {
      console.warn("No valid submissions found");
      return {
        statusCode: 204,
        body: JSON.stringify({ message: "No valid submissions." }),
      };
    }

    const postsPerPage = 5;
    const totalPages = Math.ceil(validSubmissions.length / postsPerPage);

    const getUrlDetails = (inputUrl) => {
      const url = new URL(inputUrl); // Gunakan URL yang diberikan
      const subdomain = url.hostname.split('.')[0].toUpperCase();
      const domain = url.hostname.split('.').slice(1).join('.');
      const fullUrl = url.href;
      const path = url.pathname === "/" ? "Home" : url.pathname;
      const baseUrl = `${url.protocol}//${url.hostname}`;
      const supportEmail = `support@${domain}`;
      const siteName = `${subdomain}.${domain}`;
    
      return {
        subdomain,
        domain,
        fullUrl,
        path,
        baseUrl,
        supportEmail,
        siteName,
      };
    };
    
    // Contoh penggunaan
    //const inputUrl = "https://blog.example.com/some-page";
    //const urlDetails = getUrlDetails(inputUrl);

    // Tampilkan hasil
    //console.log(urlDetails);


    const urlDetails = getUrlDetails(process.env.SITE_URL || "https://example.com");
    //console.log(`Support email: ${urlDetails.supportEmail}`);

    
const getTimestamp = () => {
  const now = new Date();
  return new Date(now.getTime() + (7 * 60 * 60 * 1000)).toISOString().replace("Z", "WIB");
};




    

const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "") // Hapus semua HTML tags
    .replace(/[^\x20-\x7E]/g, "") // Hapus simbol non-ASCII
    .replace(/[<>?!.\\/]/g, " ") // Hapus simbol tertentu: <, >, ?, !, \, /
    .replace(/[()]/g, " ") // Hapus tanda kurung ()
    .trim(); // Menghapus spasi berlebih di awal/akhir
};


        const fileNames = []; // Array untuk menyimpan nama file yang dibuat


    const results = []; // barisbaru: array untuk menyimpan response GitHub

    const fileDetails = []; // Array untuk menyimpan detail file (nama + waktu)


    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * postsPerPage;
      const currentPosts = validSubmissions.slice(startIndex, startIndex + postsPerPage);

      const postListHTML = currentPosts
        .map((submission) => {
          const { title, slug, tags, category, bodypost, author, imagefile } = submission.data;
          const cleanBodyPost = cleanText(bodypost);
          const snippet = cleanBodyPost
            ? cleanBodyPost.split(" ").slice(0, 17).join(" ") + " ..."
            : "No description snippet";

          const teaser = cleanBodyPost
            ? cleanBodyPost.split(" ").slice(0, 50).join(" ") + " ..."
            : "No description snippet";

          
          const imageUrl = imagefile?.url || "/350x600xBW.webp";

          
          // Refill untuk meta tags data
          let metaDescription = snippet;
          let pageTitle = title;
          let metaAuthor = author;

          
          return `
            <div class="grid-item">
              <a href="/static/${slug}" style="text-decoration: none; color: inherit;">
                <img src="${imageUrl}" alt="${title}" />
                <h2>${title}</h2>
                <p>${teaser}</p>
              </a>
            </div>`;
        })
        .join("\n");




    const paginationHTML = Array.from({ length: totalPages }, (_, i) => {
        const pageIndex = i + 1;
        const fileName = pageIndex === 1 ? "index.html" : `index-static-page${pageIndex}.html`;
        const activeClass = pageIndex === page ? "active" : "";
        return `<a href="/${fileName}" class="${activeClass}">${pageIndex}</a>`;
      }).join("\n");



      








        // Ambil data item post pertama

      //const firstPost = submissions[0]?.data ?? {}; // Menggunakan nullish coalescing
      const firstPost = currentPosts[0]?.data ?? {}; // baris ini diubah

  const {
    title: firstTitle = "Default Page Title",
    author: firstAuthor = "Default Author",
    bodypost: firstBodyPost = "",
  } = firstPost;
  const metaDescription = cleanText(firstBodyPost).split(" ").slice(0, 17).join(" ") + " ..."; // baris ini diubah
  const pageTitle = firstTitle; // baris ini diubah
  const metaAuthor = firstAuthor; // baris ini diubah

      

      







      
  // Template HTML
  const templateHTML = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" id="meta-description" content="${metaDescription}">
      <meta name="author" id="meta-author" content="${metaAuthor}">
      <meta name="robots" content="index, follow">
      <link rel="dns-prefetch" href="https://res.cloudinary.com">
      <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/rss.xml">
      <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">
  
      <title id="page-title">${pageTitle}</title>

      <link rel="stylesheet" href="/index-html.css">

      <!-- JSON-LD Schema -->
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "${urlDetails.siteName} ${pageTitle}",
          "description": "${metaDescription}",
          "author": {
            "@type": "Person",
            "name": "${metaAuthor}"
          },
          "url": "${urlDetails.fullUrl}"
        }
      </script>


        
    </head>
    <body>




      <div class="container">

        <header>
          <nav class="menu">
            <a href="/login/">Login</a> | 
            <a href="#search_input" onclick="focusSearchInput()">Search</a>
          </nav>
        
          <!-- Post Title -->
          <h1 style="display: block;">Posts</h1>
          <span id="post-title"></span>
        
        </header>
      
        <div id="post-list" class="grid" style="display: flex;">


          
                {{POSTS}}
        
        
                
                
        </div><!-- class grid ditutup -->
      
        <div id="pagination" class="pagination" style="display: flex;">
            ${paginationHTML}
          
        </div><!-- class pagination ditutup -->



        <br>
    
        <script>
          // Fungsi untuk memindahkan fokus ke input teks pencarian
          function focusSearchInput() {
            const searchInput = document.getElementById('search_input');
            if (searchInput) {
              searchInput.focus();
            }
          }

          const searchFormLocation = document.getElementById('search_Form_Location');
          if (searchFormLocation && searchFormLocation.parentNode) {
            searchFormLocation.parentNode.insertBefore(focusLink, searchFormLocation);
          }
          
        </script>

        <div><!-- start of  Comment Section -->
          <br><br>
                
          <div id="search_Form_Location">
              <form method="get" target="_blank" action="/search/">
                <input type="hidden" name="cx" value="c2e34c8ead538447e">
                <input type="hidden" name="ie" value="UTF-8">
                <input type="text" name="q" placeholder="Search..." id="search_input">
                <button type="submit">Search</button>
              </form>
          </div><!-- id search_Form_Location ditutup -->
          
          <br><br>
          
          
    
        </div><!-- end of  Comment Section -->
      </div><!-- class container ditutup -->



      <!-- Placeholder untuk Footer -->
      <div id="footer-placeholder" class="footer-placeholder"></div>
    
      <footer style="display: block;">
        <nav class="footer-menu">
          <a href="/login/">Login</a>
          <a href="/privacy">Privacy</a>
          <a href="/tos">Terms</a>
          <a href="/contact-us">Contact</a>
          <a href="/sitemap.xml/">Map</a>
        
        </nav>
        <br>
      
        <p>© <span id="current-year">2024</span> <span id="site-name">${urlDetails.siteName}</span>. All Rights Reserved.</p>
      </footer>
  
  
  
    </body>
  </html>`;


      const finalHTML = templateHTML.replace("{{POSTS}}", postListHTML);
      const encodedContent = Buffer.from(finalHTML).toString("base64");
      //const filePath = `index-static-page${page}.html`;

      //const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${filePath}`;




      const fileName = page === 1 ? "index.html" : `index-static-page${page}.html`;
      fileNames.push(fileName); // Tambahkan nama file ke array

      //const timestamp = new Date().toISOString(); // Tambahkan timestamp
      const timestamp = getTimestamp();
      fileDetails.push({ fileName, timestamp }); // Simpan detail file dan timestamp


      const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${fileName}`;





      

      const fileResponse = await fetch(GITHUB_API_URL, {
        method: "GET",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        sha = fileData?.sha || null; // Tetap aman jika file belum ada.
      }

      const githubResponse = await fetch(GITHUB_API_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${GITHUB_TOKEN}`,
        },
        body: JSON.stringify({
          message: `Update ${fileName}`,
          content: encodedContent,
          sha: sha || undefined,
        }),
      });

      results.push(githubResponse); // barisbaru: Tambahkan response ke array results

      console.log({
        filename: fileName,
        totalSubmissions: submissions.length,
        validSubmissions: validSubmissions.length,
        totalPages,
      });




      
    }

    for (const res of results) { // barisbaru: Iterasi dan validasi setiap response
      if (!res.ok) {
        const errorDetails = await res.json();
        //throw new Error(`Failed to upload ${fileName}: ${JSON.stringify(errorDetails)}`);
        //throw new Error(`Failed to upload page: ${res.statusText}. Details: ${JSON.stringify(errorDetails)}`);
        throw new Error(`Failed to upload ${fileName}. Status: ${res.statusText}, Details: ${JSON.stringify(errorDetails)}`);



      }
    }





return {
  statusCode: 200,
  body: JSON.stringify({
    message: "All pages generated successfully",
    timestamp: getTimestamp(), // Timestamp utama
    pages: fileNames,
    details: fileDetails // Rincian waktu pembuatan setiap file
  }, null, 2) // Tambahkan null dan 2 di sini untuk format human-readable
};

    
  } catch (error) {
    console.error("Error in combined handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
