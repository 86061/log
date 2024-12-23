const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.REPO;
const NETLIFY_ACCESS_TOKEN = process.env.NET_TOKEN;
const SUB_DOMAIN = 'jobsus';
const DOMAIN = 'netlify.app';
const SITE_NAME_TITLE = 'POSTS';
const POST_DIR = 'static';

const formatRFC822 = (date) => {
  return new Date(date).toUTCString();
};

const escapeXML = (str) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[^\x20-\x7E]/g, '');
};

const truncateToWords = (text, maxLength) => {
  if (!text) return '';
  const words = text.split(/\s+/);
  let truncated = '';
  for (const word of words) {
    if ((truncated + word).length > maxLength) break;
    truncated += (truncated ? ' ' : '') + word;
  }
  return truncated;
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
    throw new Error(`Failed to save RSS feed: ${errorDetails}`);
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
    const postsPerPage = 3;

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

    // Generate RSS feed content
    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>${escapeXML(SITE_NAME_TITLE)} - Page ${currentPage}</title>
        <link>https://${SUB_DOMAIN}.${DOMAIN}</link>
        <description>RSS feed for form submissions (Page ${currentPage} of ${totalPages})</description>
        <atom:link href="https://${SUB_DOMAIN}.${DOMAIN}/rssfeed-page-${currentPage}.xml" rel="self" type="application/rss+xml" />
        ${paginatedSubmissions
          .map((submission, index) => {
            const {
              title,
              slug,
              tags,
              category,
              bodypost,
              author,
              imagefile,
              ip,
            } = submission.data;

            const createdAt = submission.created_at || new Date().toISOString();
            const imageFileUrl = imagefile?.url || 'No image URL';
            const cleanedBody = cleanText(bodypost);
            const metaDescription = truncateToWords(cleanedBody, 155) || 'No bodypost content available';

            const postSlug = slug || `post-${startIndex + index + 1}`;
            const postUrl = `https://${SUB_DOMAIN}.${DOMAIN}/${POST_DIR}/${postSlug}.html`;

            return `
            <item>
              <title>${escapeXML(title || `Submission ${startIndex + index + 1}`)}</title>
              <link>${escapeXML(postUrl)}</link>
              <description>${escapeXML(metaDescription)}</description>
              <category>${escapeXML(category || 'Uncategorized')}</category>
              <author>${escapeXML(`${author || 'Master'}@${SUB_DOMAIN}.${DOMAIN} (${author || 'Master'})`)}</author>
              <pubDate>${formatRFC822(createdAt)}</pubDate>
              <guid isPermaLink="true">${escapeXML(postUrl)}</guid>
              <media:content url="${escapeXML(imageFileUrl)}" />
            </item>`;
          })
          .join('\n')}
      </channel>
    </rss>`;

    const encodedContent = Buffer.from(rssContent).toString('base64');
    const fileName = `rssfeed-page-${currentPage}.xml`;

    // Try to save the RSS feed file for the current page, handle conflicts
    let sha = await getFileShaFromGitHub(fileName);
    let result;

    try {
      result = await saveFileToGitHub(fileName, encodedContent, `Update RSS feed for page ${currentPage}`, sha);
    } catch (error) {
      if (error.message.includes('is at') && error.message.includes('expected')) {
        sha = await getFileShaFromGitHub(fileName);
        result = await saveFileToGitHub(fileName, encodedContent, `Update RSS feed for page ${currentPage}`, sha);
      } else {
        throw error;
      }
    }

    console.log(`RSS feed saved successfully for page ${currentPage}`);

    // Check if there are more pages and create additional files if necessary
    if (currentPage < totalPages) {
      const nextPageResponse = await exports.handler({
        queryStringParameters: { page: currentPage + 1 },
      });
      return nextPageResponse;
    }

    // Generate Index RSS feed after all sub-RSS files have been created
    const indexContent = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>${escapeXML(SITE_NAME_TITLE)} - Index</title>
        <link>https://${SUB_DOMAIN}.${DOMAIN}</link>
        <description>Index for paginated RSS feed</description>
        <atom:link href="https://${SUB_DOMAIN}.${DOMAIN}/rss.xml" rel="self" type="application/rss+xml" />
        ${Array.from({ length: totalPages }, (_, i) => {
          const pageIndex = i + 1;
          const pageUrl = `https://${SUB_DOMAIN}.${DOMAIN}/rssfeed-page-${pageIndex}.xml`;

          return `
          <item>
            <title>${escapeXML(SITE_NAME_TITLE)} - Page ${pageIndex}</title>
            <link>${escapeXML(pageUrl)}</link>
            <description>RSS feed for page ${pageIndex}</description>
            <guid isPermaLink="true">${escapeXML(pageUrl)}</guid>
          </item>`;
        }).join('\n')}
      </channel>
    </rss>`;

    const indexEncodedContent = Buffer.from(indexContent).toString('base64');
    const indexFileName = 'rss.xml';

    // Save RSS feed index to GitHub
    sha = await getFileShaFromGitHub(indexFileName);

    try {
      await saveFileToGitHub(indexFileName, indexEncodedContent, 'Update RSS feed index', sha);
    } catch (error) {
      if (error.message.includes('is at') && error.message.includes('expected')) {
        sha = await getFileShaFromGitHub(indexFileName);
        await saveFileToGitHub(indexFileName, indexEncodedContent, 'Update RSS feed index', sha);
      } else {
        throw error;
      }
    }

    console.log('RSS index generated successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `RSS feed saved successfully for page ${currentPage}`,
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
