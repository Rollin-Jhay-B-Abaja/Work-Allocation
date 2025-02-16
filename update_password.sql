USE workforce;
UPDATE users SET password = '$2y$12$VKrODfjdwGmexq26b47ZF.b.7Ol3iGIPfXJebiGBaj5RHXTtOv6/G' WHERE username = 'admin';
SELECT password, LENGTH(password) FROM users WHERE username = 'admin';
