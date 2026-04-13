const { App } = require('@slack/bolt');
const axios = require('axios');
require('dotenv').config();

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// Obsidian configuration
const obsidianConfig = {
  apiUrl: process.env.OBSIDIAN_API_URL || 'http://localhost:27123',
  apiKey: process.env.OBSIDIAN_API_KEY,
  vaultName: process.env.OBSIDIAN_VAULT_NAME,
  folder: process.env.OBSIDIAN_FOLDER || 'Slack Messages'
};

/**
 * Save content to Obsidian using Local REST API
 * Requires the Obsidian Local REST API plugin to be installed and configured
 */
async function saveToObsidian(title, content) {
  try {
    const notePath = `${obsidianConfig.folder}/${title}.md`;

    const response = await axios.put(
      `${obsidianConfig.apiUrl}/vault/${notePath}`,
      content,
      {
        headers: {
          'Authorization': `Bearer ${obsidianConfig.apiKey}`,
          'Content-Type': 'text/markdown'
        }
      }
    );

    return { success: true, path: notePath };
  } catch (error) {
    console.error('Error saving to Obsidian:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Format the Slack message for Obsidian
 */
function formatMessageForObsidian(message, user, channel, permalink) {
  const timestamp = new Date(parseFloat(message.ts) * 1000);
  const formattedDate = timestamp.toISOString();

  let content = `---
source: Slack
channel: ${channel}
user: ${user}
timestamp: ${formattedDate}
permalink: ${permalink}
---

# Slack Message from ${user}

**Date:** ${timestamp.toLocaleString()}
**Channel:** ${channel}

## Content

${message.text || ''}

`;

  // Add thread context if it's a thread
  if (message.thread_ts) {
    content += `\n**Thread:** Yes\n`;
  }

  // Add attachments if any
  if (message.attachments && message.attachments.length > 0) {
    content += `\n## Attachments\n\n`;
    message.attachments.forEach((attachment, i) => {
      if (attachment.text) {
        content += `### Attachment ${i + 1}\n${attachment.text}\n\n`;
      }
    });
  }

  // Add files if any
  if (message.files && message.files.length > 0) {
    content += `\n## Files\n\n`;
    message.files.forEach((file, i) => {
      content += `- [${file.name}](${file.permalink})\n`;
    });
  }

  return content;
}

/**
 * Message shortcut handler
 * This is triggered when a user clicks the shortcut on a message
 */
app.shortcut('save_to_obsidian', async ({ shortcut, ack, client, logger }) => {
  try {
    // Acknowledge the shortcut request
    await ack();

    const message = shortcut.message;
    const channelId = shortcut.channel.id;
    const messageTs = message.ts;

    // Get user info
    let userName = 'Unknown User';
    try {
      const userInfo = await client.users.info({ user: message.user });
      userName = userInfo.user.real_name || userInfo.user.name;
    } catch (error) {
      logger.error('Error fetching user info:', error);
    }

    // Get channel info
    let channelName = 'Unknown Channel';
    try {
      const channelInfo = await client.conversations.info({ channel: channelId });
      channelName = channelInfo.channel.name || channelInfo.channel.id;
    } catch (error) {
      logger.error('Error fetching channel info:', error);
    }

    // Get message permalink
    let permalink = '';
    try {
      const permalinkResponse = await client.chat.getPermalink({
        channel: channelId,
        message_ts: messageTs
      });
      permalink = permalinkResponse.permalink;
    } catch (error) {
      logger.error('Error fetching permalink:', error);
    }

    // Format the content
    const noteTitle = `${channelName}_${new Date(parseFloat(messageTs) * 1000).toISOString().split('T')[0]}_${messageTs.replace('.', '_')}`;
    const noteContent = formatMessageForObsidian(message, userName, channelName, permalink);

    // Save to Obsidian
    const result = await saveToObsidian(noteTitle, noteContent);

    // Send confirmation to user
    if (result.success) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: shortcut.user.id,
        text: `✅ Message saved to Obsidian at: \`${result.path}\``
      });
    } else {
      await client.chat.postEphemeral({
        channel: channelId,
        user: shortcut.user.id,
        text: `❌ Failed to save message to Obsidian: ${result.error}\n\nPlease check your Obsidian Local REST API configuration.`
      });
    }

  } catch (error) {
    logger.error('Error handling shortcut:', error);
  }
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡️ Slack app is running!');
  console.log(`📝 Obsidian integration configured for vault: ${obsidianConfig.vaultName}`);
  console.log(`📁 Messages will be saved to: ${obsidianConfig.folder}/`);
})();
