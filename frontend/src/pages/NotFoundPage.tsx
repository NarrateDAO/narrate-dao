import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} textAlign="center">
        <Heading as="h1" size="4xl" color="blue.500">
          404
        </Heading>
        <Heading as="h2" size="xl">
          页面未找到
        </Heading>
        <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.400')}>
          抱歉，您访问的页面不存在或已被移除。
        </Text>
        <Box pt={6}>
          <Button
            as={RouterLink}
            to="/"
            colorScheme="blue"
            size="lg"
          >
            返回首页
          </Button>
        </Box>
      </VStack>
    </Container>
  );
};

export default NotFoundPage; 