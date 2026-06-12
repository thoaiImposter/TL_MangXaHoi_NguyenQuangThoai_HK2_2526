package com.app.backend.service;

import com.app.backend.entity.Block;
import com.app.backend.entity.User;
import com.app.backend.repository.BlockRepository;
import com.app.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BlockService {

    private final BlockRepository blockRepository;
    private final UserRepository userRepository;

    public BlockService(BlockRepository blockRepository, UserRepository userRepository) {
        this.blockRepository = blockRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void blockUser(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new IllegalArgumentException("Cannot block yourself");
        }
        if (blockRepository.existsByBlockerIdAndBlockedId(blockerId, blockedId)) {
            throw new IllegalArgumentException("Already blocked");
        }
        User blocker = userRepository.findById(blockerId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User blocked = userRepository.findById(blockedId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Block block = new Block();
        block.setBlocker(blocker);
        block.setBlocked(blocked);
        blockRepository.save(block);
    }

    @Transactional
    public void unblockUser(Long blockerId, Long blockedId) {
        Block block = blockRepository.findByBlockerIdAndBlockedId(blockerId, blockedId)
            .orElseThrow(() -> new IllegalArgumentException("Not blocked"));
        blockRepository.delete(block);
    }

    public List<Map<String, Object>> getBlockedList(Long blockerId) {
        return blockRepository.findByBlockerId(blockerId).stream()
            .map(b -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", b.getBlocked().getId());
                map.put("fullName", b.getBlocked().getFullName());
                map.put("avatar", b.getBlocked().getAvatar() == null ? "" : b.getBlocked().getAvatar());
                map.put("createdAt", b.getCreatedAt().toString());
                return map;
            })
            .toList();
    }

    public boolean isBlocked(Long userId1, Long userId2) {
        return blockRepository.existsByBlockerIdAndBlockedId(userId1, userId2)
            || blockRepository.existsByBlockerIdAndBlockedId(userId2, userId1);
    }
}
