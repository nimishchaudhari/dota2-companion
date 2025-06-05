import React, { useState } from 'react';
import { 
  Card, 
  Alert, 
  Button, 
  Collapse, 
  Tag, 
  Space, 
  Typography, 
  Divider,
  Modal,
  Input
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined,
  SettingOutlined,
  CopyOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import envConfig from '../config/envConfig.js';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const ConfigStatus = () => {
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [template] = useState(() => envConfig.generateEnvTemplate(true));

  const suggestions = envConfig.getConfigurationSuggestions();
  const isConfigured = envConfig.isFullyConfigured();
  const openDotaConfigured = envConfig.isOpenDotaConfigured();
  const steamConfigured = envConfig.isSteamConfigured();

  const copyTemplate = () => {
    navigator.clipboard.writeText(template);
    Modal.success({
      title: 'Template Copied',
      content: 'Environment template has been copied to clipboard. Create .env.local in your project root and paste this content.',
    });
  };

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env.local';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (configured) => {
    return configured ? 
      <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
      <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
  };

  const getStatusTag = (configured) => {
    return configured ? 
      <Tag color="success">Configured</Tag> : 
      <Tag color="warning">Not Configured</Tag>;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <SettingOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2}>Environment Configuration</Title>
          <Text type="secondary">
            Configure your API keys for optimal performance
          </Text>
        </div>

        {/* Overall Status */}
        <Alert
          message={isConfigured ? "All API keys configured!" : "Configuration needed"}
          description={
            isConfigured 
              ? "Your application is fully configured with all recommended API keys."
              : "Some API keys are missing. The app will work but may have limited functionality."
          }
          type={isConfigured ? "success" : "warning"}
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* API Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
          <Card size="small" title={
            <Space>
              {getStatusIcon(openDotaConfigured)}
              OpenDota API
              {getStatusTag(openDotaConfigured)}
            </Space>
          }>
            <Paragraph>
              <strong>Current Status:</strong> {openDotaConfigured ? 
                "Enhanced rate limits (60,000 req/hour)" : 
                "Free tier limits (60 req/minute)"
              }
            </Paragraph>
            <Paragraph>
              <strong>Impact:</strong> {openDotaConfigured ? 
                "No rate limiting issues expected" : 
                "May experience rate limiting with heavy usage"
              }
            </Paragraph>
            {!openDotaConfigured && (
              <Text type="secondary">
                Get your API key from: <a href="https://www.opendota.com/api-keys" target="_blank" rel="noopener noreferrer">opendota.com/api-keys</a>
              </Text>
            )}
          </Card>

          <Card size="small" title={
            <Space>
              {getStatusIcon(steamConfigured)}
              Steam API
              {getStatusTag(steamConfigured)}
            </Space>
          }>
            <Paragraph>
              <strong>Current Status:</strong> {steamConfigured ? 
                "Full Steam integration available" : 
                "Limited Steam features"
              }
            </Paragraph>
            <Paragraph>
              <strong>Impact:</strong> {steamConfigured ? 
                "Steam authentication and profile data available" : 
                "Steam authentication may be limited"
              }
            </Paragraph>
            {!steamConfigured && envConfig.auth.mode === 'production' && (
              <Text type="secondary">
                Get your API key from: <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noopener noreferrer">steamcommunity.com/dev/apikey</a>
              </Text>
            )}
          </Card>
        </div>

        {/* Configuration Issues */}
        {suggestions.length > 0 && (
          <Collapse style={{ marginBottom: 24 }}>
            <Panel header={
              <Space>
                <InfoCircleOutlined />
                Configuration Suggestions ({suggestions.length})
              </Space>
            } key="suggestions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {suggestions.map((suggestion, index) => (
                  <Alert
                    key={index}
                    message={suggestion.message}
                    description={
                      <div>
                        <p><strong>Action:</strong> {suggestion.action}</p>
                        <p><strong>Impact:</strong> {suggestion.impact}</p>
                      </div>
                    }
                    type={suggestion.type === 'warning' ? 'warning' : 'info'}
                    showIcon
                  />
                ))}
              </div>
            </Panel>
          </Collapse>
        )}

        {/* Environment Template */}
        <Divider>Environment Setup</Divider>
        <div style={{ textAlign: 'center' }}>
          <Paragraph>
            Need help setting up your environment? Use our template to get started quickly.
          </Paragraph>
          <Space>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => setTemplateModalVisible(true)}
            >
              View Template
            </Button>
            <Button 
              icon={<CopyOutlined />}
              onClick={copyTemplate}
            >
              Copy Template
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={downloadTemplate}
            >
              Download .env.local
            </Button>
          </Space>
        </div>

        {/* Current Configuration Details */}
        <Collapse style={{ marginTop: 24 }}>
          <Panel header="Current Configuration" key="config">
            <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              <p><strong>Environment:</strong> {envConfig.app.environment}</p>
              <p><strong>Auth Mode:</strong> {envConfig.auth.mode}</p>
              <p><strong>OpenDota URL:</strong> {envConfig.opendota.apiUrl}</p>
              <p><strong>Steam URL:</strong> {envConfig.steam.apiUrl}</p>
              <p><strong>Cache TTL:</strong> {envConfig.cache.ttl / 1000}s</p>
              <p><strong>Features:</strong></p>
              <ul>
                {Object.entries(envConfig.features).map(([key, value]) => (
                  <li key={key}>{key}: {value ? 'enabled' : 'disabled'}</li>
                ))}
              </ul>
            </div>
          </Panel>
        </Collapse>
      </Card>

      {/* Template Modal */}
      <Modal
        title="Environment Configuration Template"
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        width={700}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={copyTemplate}>
            Copy Template
          </Button>,
          <Button key="download" icon={<DownloadOutlined />} onClick={downloadTemplate}>
            Download .env.local
          </Button>,
          <Button key="close" onClick={() => setTemplateModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <Paragraph>
          Copy this template to create your <code>.env.local</code> file in the project root:
        </Paragraph>
        <TextArea
          value={template}
          rows={15}
          style={{ fontFamily: 'monospace', fontSize: '12px' }}
          readOnly
        />
      </Modal>
    </div>
  );
};

export default ConfigStatus;