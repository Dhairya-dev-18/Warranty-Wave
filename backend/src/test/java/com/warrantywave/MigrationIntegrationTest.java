package com.warrantywave;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(properties = "jwt.secret=test-secret-that-is-long-enough-for-hmac-sha")
class MigrationIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("warrantywave")
            .withUsername("warranty")
            .withPassword("warranty");

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void hibernateCreatesMysqlSchema() {
        Integer usersTable = jdbc.queryForObject(
                "select count(*) from information_schema.tables where table_schema = database() and table_name = 'app_user'",
                Integer.class);
        Integer plansTable = jdbc.queryForObject(
                "select count(*) from information_schema.tables where table_schema = database() and table_name = 'warranty_plan'",
                Integer.class);
        assertThat(usersTable).isEqualTo(1);
        assertThat(plansTable).isEqualTo(1);
    }
}
