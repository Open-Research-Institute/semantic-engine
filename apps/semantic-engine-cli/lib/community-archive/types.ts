export interface Archive {
    "upload-options": {
        keepPrivate: boolean
        uploadLikes: boolean
        startDate: string
        endDate: string
    }
    profile: {
        profile: {
            description: {
                bio: string
                website: string
                location: string
            }
            avatarMediaUrl: string
            headerMediaUrl: string
        }
    }[]
    account: {
        account: {
            createdVia: string
            username: string
            accountId: string
            createdAt: string
            accountDisplayName: string
        }
    }[]
    tweets: {
        tweet: {
            edit_info: {
                initial: {
                    editTweetIds: string[]
                    editableUntil: string
                    editsRemaining: string
                    isEditEligible: boolean
                }
            }
            retweeted: boolean
            source: string
            entities: {
                hashtags: unknown[]
                symbols: {
                    text: string
                    indices: string[]
                }[]
                user_mentions: {
                    name: string
                    screen_name: string
                    indices: string[]
                    id_str: string
                    id: string
                }[]
                urls: {
                    url: string
                    expanded_url: string
                    display_url: string
                    indices: string[]
                }[]
                media?: {
                    expanded_url: string
                    source_status_id?: string
                    indices: string[]
                    url: string
                    media_url: string
                    id_str: string
                    source_user_id?: string
                    id: string
                    media_url_https: string
                    source_user_id_str?: string
                    sizes: {
                        large: {
                            w: string
                            h: string
                            resize: string
                        }
                        small: {
                            w: string
                            h: string
                            resize: string
                        }
                        thumb: {
                            w: string
                            h: string
                            resize: string
                        }
                        medium: {
                            w: string
                            h: string
                            resize: string
                        }
                    }
                    type: string
                    source_status_id_str?: string
                    display_url: string
                }[]
            }
            display_text_range: string[]
            favorite_count: string
            in_reply_to_status_id_str?: string
            id_str: string
            in_reply_to_user_id?: string
            truncated: boolean
            retweet_count: string
            id: string
            in_reply_to_status_id?: string
            created_at: string
            favorited: boolean
            full_text: string
            lang: string
            in_reply_to_screen_name?: string
            in_reply_to_user_id_str?: string
            possibly_sensitive?: boolean
            extended_entities?: {
                media: {
                    expanded_url: string
                    source_status_id?: string
                    indices: string[]
                    url: string
                    media_url: string
                    id_str: string
                    source_user_id?: string
                    id: string
                    media_url_https: string
                    source_user_id_str?: string
                    sizes: {
                        large: {
                            w: string
                            h: string
                            resize: string
                        }
                        small: {
                            w: string
                            h: string
                            resize: string
                        }
                        thumb: {
                            w: string
                            h: string
                            resize: string
                        }
                        medium: {
                            w: string
                            h: string
                            resize: string
                        }
                    }
                    type: string
                    source_status_id_str?: string
                    display_url: string
                    video_info?: {
                        aspect_ratio: string[]
                        duration_millis: string
                        variants: {
                            bitrate?: string
                            content_type: string
                            url: string
                        }[]
                    }
                    additional_media_info?: {
                        monetizable: boolean
                    }
                }[]
            }
        }
    }[]
    "community-tweet": {
        tweet: {
            retweeted: boolean
            source: string
            entities: {
                hashtags: unknown[]
                symbols: unknown[]
                user_mentions: {
                    name: string
                    screen_name: string
                    indices: string[]
                    id_str: string
                    id: string
                }[]
                urls: {
                    url: string
                    expanded_url: string
                    display_url: string
                    indices: string[]
                }[]
                media?: {
                    expanded_url: string
                    indices: string[]
                    url: string
                    media_url: string
                    id_str: string
                    id: string
                    media_url_https: string
                    sizes: {
                        medium: {
                            w: string
                            h: string
                            resize: string
                        }
                        small: {
                            w: string
                            h: string
                            resize: string
                        }
                        thumb: {
                            w: string
                            h: string
                            resize: string
                        }
                        large: {
                            w: string
                            h: string
                            resize: string
                        }
                    }
                    type: string
                    display_url: string
                }[]
            }
            display_text_range: string[]
            favorite_count: string
            in_reply_to_status_id_str?: string
            id_str: string
            scopes: {
                followers: boolean
            }
            in_reply_to_user_id?: string
            truncated: boolean
            retweet_count: string
            id: string
            in_reply_to_status_id?: string
            community_id: string
            community_id_str: string
            created_at: string
            favorited: boolean
            full_text: string
            lang: string
            in_reply_to_screen_name?: string
            in_reply_to_user_id_str?: string
            possibly_sensitive?: boolean
            extended_entities?: {
                media: {
                    expanded_url: string
                    indices: string[]
                    url: string
                    media_url: string
                    id_str: string
                    video_info: {
                        aspect_ratio: string[]
                        variants: {
                            bitrate: string
                            content_type: string
                            url: string
                        }[]
                    }
                    id: string
                    media_url_https: string
                    sizes: {
                        medium: {
                            w: string
                            h: string
                            resize: string
                        }
                        small: {
                            w: string
                            h: string
                            resize: string
                        }
                        thumb: {
                            w: string
                            h: string
                            resize: string
                        }
                        large: {
                            w: string
                            h: string
                            resize: string
                        }
                    }
                    type: string
                    display_url: string
                }[]
            }
        }
    }[]
    follower: {
        follower: {
            accountId: string
            userLink: string
        }
    }[]
    following: {
        following: {
            accountId: string
            userLink: string
        }
    }[]
    "note-tweet": unknown[]
    like: {
        like: {
            tweetId: string
            fullText?: string
            expandedUrl: string
        }
    }[]
}
