import React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components';
import { brand } from '../brand';

interface Props {
  name: string;
}

export function PaymentFailedEmail({ name }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: brand.background, fontFamily: 'sans-serif' }}>
        <Container
          style={{
            maxWidth: 560,
            margin: '40px auto',
            backgroundColor: brand.surface,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Section style={{ backgroundColor: '#dc2626', padding: '32px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>
              {brand.name}
            </Text>
          </Section>
          <Section style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary }}>
              Payment issue on your account, {name}
            </Text>
            <Text style={{ fontSize: 15, color: brand.textMuted, lineHeight: 1.6 }}>
              We were unable to process your subscription payment. Please update your payment method
              to keep using {brand.name} without interruption.
            </Text>
            <Button
              href={`${brand.url}/settings/billing`}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: 16,
              }}
            >
              Update payment method
            </Button>
            <Hr style={{ margin: '32px 0', borderColor: brand.border }} />
            <Text style={{ fontSize: 13, color: brand.textLight }}>
              Need help? Contact us at {brand.email}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
