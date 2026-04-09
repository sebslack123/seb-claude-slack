# Slack to Obsidian Integration

A Slack app that allows you to save Slack messages directly to your Obsidian vault using a message shortcut.

## Features

- **Message Shortcut**: Right-click (or use the actions menu) on any Slack message and select "Save to Obsidian"
- **Rich Metadata**: Automatically captures message content, sender, channel, timestamp, and permalink
- **Obsidian Integration**: Uses Obsidian's Local REST API to save notes directly to your vault
- **Markdown Format**: Messages are saved as properly formatted Markdown files with frontmatter

## Prerequisites

1. **Slack Workspace**: Admin access to create a Slack app
2. **Obsidian**: Desktop version with the [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed
3. **Node.js**: Version 14 or higher

## Setup Instructions

### 1. Install Obsidian Local REST API Plugin

1. Open Obsidian
2. Go to Settings → Community Plugins
3. Search for "Local REST API"
4. Install and enable the plugin
5. In the plugin settings:
   - Enable the API
   - Copy the API key (you'll need this later)
   - Note the port (default is 27123)

### 2. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it "Save to Obsidian" and select your workspace
4. In the app settings:

#### OAuth & Permissions
Add these Bot Token Scopes:
- `channels:read`
- `chat:write`
- `users:read`
- `commands`

#### Interactivity & Shortcuts
1. Enable Interactivity
2. Create a new Message Shortcut:
   - **Name**: Save to Obsidian
   - **Short Description**: Save this message to Obsidian
   - **Callback ID**: `save_to_obsidian`

#### App-Level Tokens
Create a token with `connections:write` scope (for Socket Mode)

#### Socket Mode
Enable Socket Mode

### 3. Install the App

1. Go to "Install App" in the sidebar
2. Click "Install to Workspace"
3. Authorize the app
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
5. Copy the "Signing Secret" from Basic Information
6. Copy the App-Level Token (starts with `xapp-`)

### 4. Configure the Application

1. Clone this repository or download the files
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your credentials:
   ```
   SLACK_BOT_TOKEN=xoxb-your-token-here
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_APP_TOKEN=xapp-your-app-token
   
   OBSIDIAN_API_URL=http://localhost:27123
   OBSIDIAN_API_KEY=your-obsidian-api-key
   OBSIDIAN_VAULT_NAME=YourVaultName
   OBSIDIAN_FOLDER=Slack Messages
   ```

### 5. Install Dependencies and Run

```bash
# Install dependencies
npm install

# Start the app
npm start

# Or use nodemon for development
npm run dev
```

You should see:
```
⚡️ Slack app is running!
📝 Obsidian integration configured for vault: YourVaultName
📁 Messages will be saved to: Slack Messages/
```

## Usage

1. In Slack, hover over any message
2. Click the "More actions" menu (three dots)
3. Select "Save to Obsidian"
4. You'll see a confirmation message
5. Check your Obsidian vault in the configured folder!

## Note Format

Messages are saved with the following structure:

```markdown
---
source: Slack
channel: general
user: John Doe
timestamp: 2026-04-09T12:34:56.789Z
permalink: https://workspace.slack.com/archives/...
---

# Slack Message from John Doe

**Date:** 4/9/2026, 12:34:56 PM
**Channel:** general

## Content

The message text goes here...
```

## Troubleshooting

### "Failed to save message to Obsidian"
- Ensure Obsidian is running
- Verify the Local REST API plugin is enabled
- Check the API key and port in `.env`
- Make sure the folder specified in `OBSIDIAN_FOLDER` exists in your vault

### Shortcut doesn't appear
- Verify the callback ID is exactly `save_to_obsidian`
- Reinstall the app to your workspace
- Check that Interactivity is enabled in your Slack app settings

### Connection issues
- Ensure Socket Mode is enabled
- Verify the App-Level Token has `connections:write` scope
- Check that all tokens in `.env` are correct

## Development

The main application logic is in `app.js`. Key components:

- **Message Shortcut Handler**: Listens for the `save_to_obsidian` callback
- **Obsidian Integration**: Uses the Local REST API to create notes
- **Formatting**: Converts Slack messages to Markdown with metadata

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

Related Slack thread: https://sdo-demo-11271.slack.com/archives/C0ARG7QL84F/p1775760269325149?thread_ts=1775760087.007379&cid=C0ARG7QL84F
