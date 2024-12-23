// Fungsi untuk memuat Google Custom Search Engine (CSE)
function loadGoogleCSE() {
  const script = document.createElement('script');
  script.defer = true;
  script.src = "https://cse.google.com/cse.js?cx=c2e34c8ead538447e";

  // Append CSE script to the head tag for better performance
  document.head.appendChild(script);

  // Create the CSE container and append it to the container before COMMENT
  const gcseDiv = document.createElement('div');
  gcseDiv.classList.add('gcse-search');

  // Locate commentThread element
  const commentThread = document.getElementById('comment_thread');
  if (commentThread && commentThread.parentNode) {
    // Insert the gcseDiv before the commentThread
    commentThread.parentNode.insertBefore(gcseDiv, commentThread);
  }

     // After Google CSE is loaded, load COMMENT
          //loadDiscus();
          //loadCusdis();
    // Setelah skrip dimuat, CSE akan tampil
  script.onload = () => {
    gcseDiv.style.visibility = 'visible'; // Menampilkan div setelah Google CSE dimuat
  };

  
}



////////////////////////////




// Fungsi untuk mengganti pencarian Google CSE dengan form sederhana
function createSearchForm() {
  const form = document.createElement('form');
  form.method = 'get';
  form.target = '_blank'; // Membuka di tab baru
  form.action = '/search/';

  const cxInput = document.createElement('input');
  cxInput.type = 'hidden';
  cxInput.name = 'cx';
  cxInput.value = 'c2e34c8ead538447e'; // ID mesin pencari Anda
  form.appendChild(cxInput);

  const ieInput = document.createElement('input');
  ieInput.type = 'hidden';
  ieInput.name = 'ie';
  ieInput.value = 'UTF-8';
  form.appendChild(ieInput);

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.name = 'q';
  searchInput.placeholder = 'Search...';
  searchInput.id = 'search_input'; // Tambahkan ID
  form.appendChild(searchInput);

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Search';
  form.appendChild(submitButton);

  const commentThread = document.getElementById('comment_thread');
  if (commentThread && commentThread.parentNode) {
    commentThread.parentNode.insertBefore(form, commentThread);
  }


  
}


/////////////////////////////



  // Fungsi untuk memindahkan fokus ke input teks pencarian
  function focusSearchInput() {
    const searchInput = document.getElementById('search_input');
    if (searchInput) {
      searchInput.focus();
    }
  }



///////////////////////////

        // Fungsi untuk memuat Disqus
        function loadDisqus() {
          var disqus_config = function () {
            this.page.url = window.location.href;
            this.page.identifier = window.location.pathname;
          };

          (function() {
            var d = document, s = d.createElement('script');
            s.defer = true;
            s.src = 'https://postnetlify.disqus.com/embed.js';/* sesuaikan dengan snippet dari Disqus */
            s.setAttribute('data-timestamp', +new Date());
            (d.head || d.body).appendChild(s);
          })();
        }


////////////////////////



/*


// Fungsi untuk menyesuaikan tinggi iframe Cusdis secara otomatis
function adjustCusdisIframeHeight() {
  const iframe = document.querySelector('iframe');
  if (iframe) {
    // Set interval untuk memeriksa tinggi iframe setiap 100ms
    const interval = setInterval(() => {
      const newHeight = iframe.contentWindow.document.body.scrollHeight;
      if (newHeight && iframe.style.height !== `${newHeight}px`) {
        iframe.style.height = `${newHeight}px`; // Mengatur tinggi iframe
        clearInterval(interval); // Berhenti setelah ukuran iframe diperbarui
      }
    }, 100);
  }
}
*/



/////////////////////////////



// Fungsi untuk menyesuaikan tinggi iframe Cusdis secara otomatis setelah iframe dimuat
function adjustCusdisIframeHeight() {
  const iframe = document.querySelector('iframe');
  
  if (iframe) {
    // Pastikan iframe sudah dimuat sepenuhnya
    iframe.onload = function () {
      const updateIframeHeight = () => {
        try {
          // Mengukur tinggi konten di dalam iframe
          const newHeight = iframe.contentWindow.document.body.scrollHeight;
          
          // Memastikan ukuran iframe diperbarui jika berbeda
          if (newHeight && iframe.style.height !== `${newHeight}px`) {
            iframe.style.height = `${newHeight}px`;
          }
        } catch (error) {
          console.error("Tidak dapat mengakses konten iframe:", error);
        }
      };
      
      // Menyesuaikan tinggi langsung setelah iframe dimuat
      updateIframeHeight();
      
      // Set interval untuk memeriksa tinggi iframe jika konten berubah
      const interval = setInterval(updateIframeHeight, 500); // Cek setiap 500ms
      
      // Berhenti memeriksa setelah 5 detik untuk menghindari loop tak terbatas
      setTimeout(() => clearInterval(interval), 5000);
    };
  }
}


////////////////


  
// Fungsi untuk memuat Cusdis
function loadCusdis() {
  const pageUrl = window.location.href;
  const pageIdentifier = window.location.pathname;
  const pageTitle = document.title;

  // Membuat elemen div untuk thread Cusdis
  const cusdisDiv = document.createElement('div');
  cusdisDiv.id = "cusdis_thread";
  cusdisDiv.setAttribute("data-host", "https://cusdis.com");
  cusdisDiv.setAttribute("data-app-id", "e048e64e-1b6a-4db2-a0b8-fcd6ef3fc325");
  cusdisDiv.setAttribute("data-page-id", pageIdentifier);
  cusdisDiv.setAttribute("data-page-url", pageUrl);
  cusdisDiv.setAttribute("data-page-title", pageTitle);

  // Menambahkan elemen div ke dalam post-body setelah selesai dimuat
  const postBody = document.getElementById('post-body');
  if (postBody) {
    postBody.parentNode.insertBefore(cusdisDiv, postBody.nextSibling); // Tempatkan setelah post-body
  }

  // Membuat dan menambahkan skrip Cusdis
  const script = document.createElement('script');
  script.src = "https://cusdis.com/js/cusdis.es.js";

  // Menunggu sampai skrip Cusdis selesai dimuat sebelum mengubah visibilitas
  script.onload = () => {
    cusdisDiv.style.visibility = 'visible'; // Menampilkan setelah skrip dimuat
    adjustCusdisIframeHeight(); // Menyesuaikan tinggi iframe setelah skrip dimuat
  };

  document.body.appendChild(script); // Menambahkan skrip ke dalam body
}



//////////////////////



function stripHtmlTags(input) {
  var doc = new DOMParser().parseFromString(input, 'text/html');
  return doc.body.textContent || "";
}


//////////////////////



// Fungsi untuk memperbarui JSON-LD schema secara dinamis
function updateJsonLdSchema() {
  const postData = window.postData; // Ambil data post dari variabel global

  // Periksa jika postData ada
  if (!postData) {
    console.error("Post data is not available yet.");
    return;
  }

    // Strip HTML tags from articleBody for JSON-LD
  const cleanBody = stripHtmlTags(postData.bodypost);

  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": postData.title,
    "author": {
      "@type": "Person",
      "name": postData.author,
      "url": postData.authorUrl || "https://example.com/author"
    },
    "datePublished": postData.datePublished,
    "dateModified": postData.dateModified || postData.datePublished,
    "image": postData.imageUrl,
    //"articleBody": postData.body,
        "articleBody": cleanBody,  // Use cleaned body text
    "url": window.location.href,
    "publisher": {
      "@type": "Organization",
      "name": "Your Blog Name",
      "logo": {
        "@type": "ImageObject",
        "url": "https://example.com/logo.png"
      }
    }
  };

  // Menyisipkan data JSON-LD ke dalam elemen <script>
  const jsonLdScript = document.getElementById('json-ld-schema');
  jsonLdScript.innerHTML = JSON.stringify(schemaData);
}





///////////////////////




    
 async function fetchPostBySlug() {
  try {
    const pathArray = window.location.pathname.split('/');
    const slug = pathArray[pathArray.length - 1]; // Ambil slug dari akhir URL

    if (!slug) {
      throw new Error('Slug not found in the URL');
    }

    // Fetch the post data from the Netlify Lambda function
    const response = await fetch(`/.netlify/functions/readSinglePost?slug=${slug}`);

    if (!response.ok) {
      throw new Error(`Error fetching post: ${response.status}`);
    }

    // Parse the JSON response
    const post = await response.json();

  //const post = await response.json();
    window.postData = post.data; // Simpan data post ke dalam variabel global
if (!window.postData) {
  console.error("Post data is not available.");
  return;
}

    // Human readable date
    const createdAt = new Date(post.created_at);
    const humanReadableDate = createdAt.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Update the page with the post data
    document.getElementById('post-title').innerText = post.data.title;
    document.getElementById('post-author').innerText = `Author: ${post.data.author}`;
    document.getElementById('post-category').innerText = `Category: ${post.data.category}`;
    document.getElementById('post-tags').innerText = `Tags: ${post.data.tags}`;
    document.getElementById('post-date').innerText = `Published on: ${humanReadableDate}`;
    document.getElementById('post-image').src = post.data.imagefile.url;
    document.getElementById('post-image').alt = post.data.title;

    // Isi konten post-body setelah data dimuat
    document.getElementById('post-body').innerHTML = post.data.bodypost;

    // Menampilkan post-title dan post-meta secara bersamaan
    document.querySelector('h1.post-title').style.display = 'block';
    document.getElementById('post-meta').style.display = 'block';

    // Update SEO meta tags dynamically
    document.getElementById('meta-description').content = post.data.bodypost.slice(0, 155); // First 155 chars
    document.getElementById('meta-author').content = post.data.author;

    document.getElementById('page-title').innerText = post.data.title;
    document.querySelector('meta[property="og:title"]').content = post.data.title;
    document.querySelector('meta[property="og:description"]').content = post.data.bodypost.slice(0, 155);
    document.querySelector('meta[property="og:image"]').content = post.data.imagefile.url;
    document.querySelector('meta[property="og:url"]').content = window.location.href;

    document.querySelector('meta[name="twitter:title"]').content = post.data.title;
    document.querySelector('meta[name="twitter:description"]').content = post.data.bodypost.slice(0, 155);
    document.querySelector('meta[name="twitter:image"]').content = post.data.imagefile.url;

    // Update the Schema JSON-LD dynamically
    const schemaElement = document.getElementById('json-ld-schema');
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.data.title,
      "author": {
        "@type": "Person",
        "url": "https://jobsus.netlify.app/",
        "name": post.data.author
      },
      "datePublished": post.created_at,
      "dateModified": post.updated_at || post.created_at,
      "image": post.data.imagefile.url,
      "articleBody": post.data.bodypost,
        "url": window.location.href,  // Menambahkan URL halaman
      "publisher": {
        "@type": "Organization",
        "name": "POST NETLIFY",
        "logo": {
          "@type": "ImageObject",
          "url": "https://res.cloudinary.com/harga-promo-diskon/image/upload/v1733006558/ini-title-nya-superhero-gadungan-664.png.png"
        }
      }
    };
    schemaElement.innerHTML = JSON.stringify(schemaData);

  } catch (error) {
    console.error('Error fetching post:', error);
    document.getElementById('post-container').innerHTML = `<p>Error fetching post: ${error.message}</p>`;
  }
}

////////////////
