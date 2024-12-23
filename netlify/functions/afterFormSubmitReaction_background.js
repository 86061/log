//based on https://chatgpt.com/share/6766c624-0db4-8011-8246-bc86fa33808d
//simpan code ini sebagai /netlify/functions/afterFormSubmitReaction_background.js
//lalu buka https://app.netlify.com/sites/postnetlify/configuration/notifications#form-submission-notifications
//bagian Form submission notifications
//Add Notification
//HTTP POST request
//Event to listen for : New form submission
//URL to notify, isi dengan url ke file ini : https://jobsus.netlify.app/.netlify/functions/afterFormSubmitReaction_background
//Form : postForm
//lainnya kosongkan
//Save!
//nanti kalau ada kiriman post ke form ini lagi, akan memicu script ini di background process

const fetch = require("node-fetch");

exports.handler = async (event) => {
  console.log("Handler started");
  try {
    // Log the raw event body to debug input
    console.log("Raw event body:", event.body);

    // Parse form data
    let formData;
    try {
      formData = JSON.parse(event.body);
      console.log("Parsed form data:", formData);
    } catch (e) {
      console.error("Failed to parse form data:", e);
      throw new Error("Invalid JSON input");
    }

    // Log the URL and payload for the outgoing request
    const targetUrl = "https://jobsus.netlify.app/.netlify/functions/triggerManager_background";
    const payload = {
      message: "afterFormSubmitReaction.js: A New form submission triggered triggerManager_background.js running",
      data: formData
    };
    console.log("Target URL:", targetUrl);
    console.log("Payload:", payload);

    // Send the request to the desired URL
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Log response status and response body
    console.log("Response status:", response.status);
    const responseBody = await response.text();
    console.log("Response body:", responseBody);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    console.log("Handler completed successfully");
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Triggered successfully" }),
    };
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack trace:", error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
};
