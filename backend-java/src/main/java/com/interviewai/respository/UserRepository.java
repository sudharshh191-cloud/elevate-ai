package com.interviewai.backend_java.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.interviewai.backend_java.model.User;

public interface UserRepository extends MongoRepository<User, String> {

    User findByEmail(String email);
}