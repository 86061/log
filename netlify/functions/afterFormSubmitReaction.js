//based on https://chatgpt.com/share/6766c624-0db4-8011-8246-bc86fa33808d

const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    // Parse form data (opsional, jika diperlukan)
    const formData = JSON.parse(event.body);

    // Kirim permintaan ke URL yang diinginkan
    const response = await fetch(
      "https://jobsus.netlify.app/.netlify/functions/triggerManager_background",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "afterFormSubmitReaction.js: A New form submission triggered triggerManager_background.js running ", data: formData }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Triggered successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
};
