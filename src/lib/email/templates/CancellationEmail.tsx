import React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components';
import { brand } from '../brand';

interface Props {
  name: string;
}

export function CancellationEmail({ name }: Props) {
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
          <Section style={{ backgroundColor: brand.primary, padding: '32px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>
              {brand.name}
            </Text>
          </Section>
          <Section style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 18, fontWeight: 600, color: brand.textPrimary }}>
              We will miss you, {name}
            </Text>
            <Text style={{ fontSize: 15, color: brand.textMuted, lineHeight: 1.6 }}>
              Your subscription has been canceled. You still have access until the end of your
              current billing period. You can reactivate anytime.
            </Text>
            <Button
              href={`${brand.url}/settings/billing`}
              style={{
                backgroundColor: brand.primary,
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
              Reactivate subscription
            </Button>
            <Hr style={{ margin: '32px 0', borderColor: brand.border }} />
            <Text style={{ fontSize: 13, color: brand.textLight }}>
              Want to share why you canceled? Reply to this email — your feedback means a lot to us.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
