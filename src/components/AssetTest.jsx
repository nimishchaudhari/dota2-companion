import React, { useState } from 'react';
import { Card, Row, Col, Typography, Tag, Space, Divider, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { getHeroIcon, getItemIcon, getAbilityIcon, normalizeHeroName } from '../utils/assetHelpers';

const { Title, Text } = Typography;

const AssetTest = () => {
  const [assetStatus, setAssetStatus] = useState({});
  const [loading, setLoading] = useState({});

  // Test data - Updated to reflect actual available assets
  const popularHeroes = ['pudge', 'invoker', 'antimage', 'axe', 'drow_ranger', 'phantom_assassin', 'skeleton_king', 'nevermore'];
  const commonItems = ['blink', 'black_king_bar', 'boots', 'magic_wand', 'bottle', 'tango', 'aegis', 'cheese'];
  const sampleAbilities = [
    'pudge_meat_hook',
    'invoker_cold_snap',
    'antimage_blink',
    'axe_berserkers_call',
    'drow_ranger_frost_arrows',
    'phantom_assassin_stifling_dagger',
    'ability_default'
  ];

  const handleImageLoad = (key) => {
    setAssetStatus(prev => ({ ...prev, [key]: 'loaded' }));
    setLoading(prev => ({ ...prev, [key]: false }));
  };

  const handleImageError = (key, error) => {
    setAssetStatus(prev => ({ ...prev, [key]: 'error' }));
    setLoading(prev => ({ ...prev, [key]: false }));
    console.error(`Failed to load asset ${key}:`, error);
  };

  const handleImageLoadStart = (key) => {
    setLoading(prev => ({ ...prev, [key]: true }));
  };

  const AssetTestItem = ({ type, name, format = null }) => {
    const key = `${type}-${name}${format ? `-${format}` : ''}`;
    let assetUrl = '';
    
    try {
      switch (type) {
        case 'hero':
          assetUrl = getHeroIcon(name);
          break;
        case 'hero-animated':
          assetUrl = getHeroIcon(name, true);
          break;
        case 'item':
          assetUrl = getItemIcon(name, format);
          break;
        case 'ability':
          assetUrl = getAbilityIcon(name);
          break;
        default:
          assetUrl = '';
      }
    } catch (error) {
      console.error(`Error getting ${type} asset for ${name}:`, error);
      assetUrl = 'error';
    }

    const status = assetStatus[key];
    const isLoading = loading[key];

    return (
      <Card
        style={{
          border: status === 'loaded' ? '2px solid #52c41a' : status === 'error' ? '2px solid #ff4d4f' : '2px solid #434343',
          backgroundColor: '#1a1a1a',
          height: '100%'
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            height: '80px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '8px',
            position: 'relative'
          }}>
            {assetUrl === 'error' ? (
              <CloseCircleOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
            ) : (
              <>
                <img
                  src={assetUrl}
                  alt={name}
                  style={{ 
                    maxHeight: '80px', 
                    maxWidth: '100%',
                    opacity: isLoading ? 0.5 : 1
                  }}
                  onLoad={() => handleImageLoad(key)}
                  onError={(e) => handleImageError(key, e)}
                  onLoadStart={() => handleImageLoadStart(key)}
                />
                {isLoading && (
                  <LoadingOutlined style={{ 
                    position: 'absolute', 
                    fontSize: '24px',
                    color: '#1890ff'
                  }} />
                )}
              </>
            )}
          </div>
          
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong style={{ color: '#fff', fontSize: '12px' }}>
              {name}
              {format && <Tag color="blue" style={{ marginLeft: '4px' }}>{format}</Tag>}
            </Text>
            
            <div>
              {status === 'loaded' && (
                <Tag icon={<CheckCircleOutlined />} color="success">Loaded</Tag>
              )}
              {status === 'error' && (
                <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>
              )}
              {!status && !isLoading && (
                <Tag color="default">Pending</Tag>
              )}
              {isLoading && (
                <Tag icon={<LoadingOutlined />} color="processing">Loading</Tag>
              )}
            </div>
            
            <Text 
              style={{ 
                fontSize: '10px', 
                color: '#888',
                wordBreak: 'break-all',
                display: 'block'
              }}
            >
              {assetUrl}
            </Text>
          </Space>
        </div>
      </Card>
    );
  };

  // Calculate statistics
  const totalAssets = Object.keys(assetStatus).length;
  const loadedAssets = Object.values(assetStatus).filter(s => s === 'loaded').length;
  const failedAssets = Object.values(assetStatus).filter(s => s === 'error').length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      <Title level={2} style={{ color: '#fff', marginBottom: '24px' }}>
        Asset Verification Test Page
      </Title>

      <Alert
        message="Asset Loading Status"
        description={
          <Space>
            <span>Total: {totalAssets}</span>
            <span style={{ color: '#52c41a' }}>Loaded: {loadedAssets}</span>
            <span style={{ color: '#ff4d4f' }}>Failed: {failedAssets}</span>
            <span style={{ color: '#faad14' }}>Pending: {totalAssets - loadedAssets - failedAssets}</span>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Hero Icons Section */}
      <div style={{ marginBottom: '48px' }}>
        <Title level={3} style={{ color: '#fff', marginBottom: '16px' }}>
          Hero Icons (Static)
        </Title>
        <Row gutter={[16, 16]}>
          {popularHeroes.map(hero => (
            <Col key={hero} xs={12} sm={8} md={6} lg={4}>
              <AssetTestItem type="hero" name={hero} />
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ borderColor: '#434343' }} />

      {/* Animated Hero Icons Section */}
      <div style={{ marginBottom: '48px' }}>
        <Title level={3} style={{ color: '#fff', marginBottom: '16px' }}>
          Hero Icons (Animated)
        </Title>
        <Row gutter={[16, 16]}>
          {popularHeroes.map(hero => (
            <Col key={`${hero}-animated`} xs={12} sm={8} md={6} lg={4}>
              <AssetTestItem type="hero-animated" name={hero} />
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ borderColor: '#434343' }} />

      {/* Item Icons Section */}
      <div style={{ marginBottom: '48px' }}>
        <Title level={3} style={{ color: '#fff', marginBottom: '16px' }}>
          Item Icons
        </Title>
        <Title level={5} style={{ color: '#888', marginBottom: '16px' }}>
          PNG Format
        </Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {commonItems.map(item => (
            <Col key={`${item}-png`} xs={12} sm={8} md={6} lg={4}>
              <AssetTestItem type="item" name={item} format="png" />
            </Col>
          ))}
        </Row>
        
        <Title level={5} style={{ color: '#888', marginBottom: '16px' }}>
          WebP Format
        </Title>
        <Row gutter={[16, 16]}>
          {commonItems.map(item => (
            <Col key={`${item}-webp`} xs={12} sm={8} md={6} lg={4}>
              <AssetTestItem type="item" name={item} format="webp" />
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ borderColor: '#434343' }} />

      {/* Ability Icons Section */}
      <div style={{ marginBottom: '48px' }}>
        <Title level={3} style={{ color: '#fff', marginBottom: '16px' }}>
          Ability Icons
        </Title>
        <Row gutter={[16, 16]}>
          {sampleAbilities.map(ability => (
            <Col key={ability} xs={12} sm={8} md={6} lg={4}>
              <AssetTestItem type="ability" name={ability} />
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ borderColor: '#434343' }} />

      {/* Edge Cases Section */}
      <div style={{ marginBottom: '48px' }}>
        <Title level={3} style={{ color: '#fff', marginBottom: '16px' }}>
          Edge Cases & Special Tests
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <AssetTestItem type="hero" name="furion" />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <AssetTestItem type="hero" name="kez" />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <AssetTestItem type="item" name="item_default" format="webp" />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <AssetTestItem type="item" name="recipe" format="png" />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <AssetTestItem type="ability" name="invoker_quas" />
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <AssetTestItem type="ability" name="morphling_waveform" />
          </Col>
        </Row>
      </div>

      {/* Debug Information */}
      <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #434343' }}>
        <Title level={4} style={{ color: '#fff' }}>Debug Information</Title>
        <pre style={{ color: '#888', fontSize: '12px' }}>
          {JSON.stringify({
            normalizedHeroNames: {
              'Nature\'s Prophet': normalizeHeroName('Nature\'s Prophet'),
              'Anti-Mage': normalizeHeroName('Anti-Mage'),
              'Wraith King': normalizeHeroName('Wraith King'),
              'Shadow Fiend': normalizeHeroName('Shadow Fiend')
            },
            assetPaths: {
              heroIcon: '/src/assets/heroes/icons/',
              heroAnimated: '/src/assets/heroes/animated/',
              item: '/src/assets/items/',
              ability: '/src/assets/abilities/'
            }
          }, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default AssetTest;