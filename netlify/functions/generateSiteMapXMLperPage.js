const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.REPO;
const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
const SUB_DOMAIN = 'jobsus';
const DOMAIN = 'netlify.app';
const POST_DIR = 'static';

const formatDate = (date) => {
  return new Date(date).toISOString();
};

const saveFileToGitHub = async (fileName, content, message, sha = null) => {
  const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${fileName}`;
  const response = await fetch(GITHUB_API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      message,
      content,
      sha: sha || undefined,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Failed to save sitemap: ${errorDetails}`);
  }

  return response.json();
};

const getFileShaFromGitHub = async (fileName) => {
  const GITHUB_API_URL = `https://api.github.com/repos/${REPO}/contents/${fileName}`;
  const response = await fetch(GITHUB_API_URL, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });

  if (response.ok) {
    const fileData = await response.json();
    return fileData.sha;
  }

  return null;
};

exports.handler = async (event) => {
  try {
    const { page = 1 } = event.queryStringParameters || {};
    const currentPage = parseInt(page, 10);
    const postsPerPage = 3; // Maximum number of URLs per sitemap file

    if (isNaN(currentPage) || currentPage < 1) {
      throw new Error('Invalid page parameter');
    }

    // Fetch submissions from Netlify Forms
    const formId = '673faec750f0a700080c6bac';
    const endpoint = `https://api.netlify.com/api/v1/forms/${formId}/submissions`;
    const formResponse = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}`,
      },
    });

    if (!formResponse.ok) {
      throw new Error(`Failed to fetch form submissions: ${formResponse.statusText}`);
    }

    const submissions = await formResponse.json();

    // Pagination logic
    const totalPosts = submissions.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const paginatedSubmissions = submissions.slice(startIndex, startIndex + postsPerPage);

    if (currentPage > totalPages) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Page not found' }),
      };
    }

    // Generate Sitemap content
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${paginatedSubmissions
        .map((submission, index) => {
          const { slug } = submission.data;
          const postSlug = slug || `post-${startIndex + index + 1}`;
          const postUrl = `https://${SUB_DOMAIN}.${DOMAIN}/${POST_DIR}/${postSlug}.html`;
          const lastMod = formatDate(submission.created_at || new Date().toISOString());

          return `
          <url>
            <loc>${postUrl}</loc>
            <lastmod>${lastMod}</lastmod>
          </url>`;
        })
        .join('\n')}
    </urlset>`;

    const encodedContent = Buffer.from(sitemapContent).toString('base64');
    const fileName = `sitemap-${currentPage}.xml`;

    // Try to save the Sitemap file for the current page, handle conflicts
    let sha = await getFileShaFromGitHub(fileName);
    let result;

    try {
      result = await saveFileToGitHub(fileName, encodedContent, `Update Sitemap for page ${currentPage}`, sha);
    } catch (error) {
      if (error.message.includes('is at') && error.message.includes('expected')) {
        sha = await getFileShaFromGitHub(fileName);
        result = await saveFileToGitHub(fileName, encodedContent, `Update Sitemap for page ${currentPage}`, sha);
      } else {
        throw error;
      }
    }

    console.log(`Sitemap saved successfully for page ${currentPage}`);

    // Check if there are more pages and create additional files if necessary
    if (currentPage < totalPages) {
      const nextPageResponse = await exports.handler({
        queryStringParameters: { page: currentPage + 1 },
      });
      return nextPageResponse;
    }

    // Generate Index Sitemap after all sub-sitemap files have been created
    const indexContent = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${Array.from({ length: totalPages }, (_, i) => {
        const pageIndex = i + 1;
        const pageUrl = `https://${SUB_DOMAIN}.${DOMAIN}/sitemap-${pageIndex}.xml`;
        const lastMod = formatDate(new Date());

        return `
        <sitemap>
          <loc>${pageUrl}</loc>
          <lastmod>${lastMod}</lastmod>
        </sitemap>`;
      }).join('\n')}
    </sitemapindex>`;

    const indexEncodedContent = Buffer.from(indexContent).toString('base64');
    const indexFileName = 'sitemap.xml';

    // Save Sitemap index to GitHub
    sha = await getFileShaFromGitHub(indexFileName);

    try {
      await saveFileToGitHub(indexFileName, indexEncodedContent, 'Update Sitemap index', sha);
    } catch (error) {
      if (error.message.includes('is at') && error.message.includes('expected')) {
        sha = await getFileShaFromGitHub(indexFileName);
        await saveFileToGitHub(indexFileName, indexEncodedContent, 'Update Sitemap index', sha);
      } else {
        throw error;
      }
    }

    console.log('Sitemap index generated successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Sitemap saved successfully for page ${currentPage}`,
        url: result.content.html_url,
      }),
    };
  } catch (error) {
    console.error('Error in handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
