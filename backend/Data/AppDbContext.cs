using BTTakvim.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BTTakvim.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<CalendarLeaf> CalendarLeaves => Set<CalendarLeaf>();
    public DbSet<ContentCategory> ContentCategories => Set<ContentCategory>();
    public DbSet<ContentItem> ContentItems => Set<ContentItem>();
    public DbSet<HistoryEvent> HistoryEvents => Set<HistoryEvent>();
    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<BabyName> BabyNames => Set<BabyName>();
    public DbSet<BlogCategory> BlogCategories => Set<BlogCategory>();
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
    public DbSet<ForumTopic> ForumTopics => Set<ForumTopic>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Reaction> Reactions => Set<Reaction>();
    public DbSet<AppSetting> Settings => Set<AppSetting>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<CalendarLeaf>(e =>
        {
            e.HasIndex(x => x.Date).IsUnique();
            e.Property(x => x.ContentSelectionsJson).HasColumnType("jsonb");
            e.Property(x => x.HistoryEventsJson).HasColumnType("jsonb");
        });

        b.Entity<ContentCategory>(e => e.HasIndex(x => x.Slug).IsUnique());

        b.Entity<ContentItem>(e =>
        {
            e.HasOne(x => x.Category).WithMany(c => c.Items).HasForeignKey(x => x.CategoryId);
            e.HasIndex(x => new { x.PinnedMonth, x.PinnedDay });
        });

        b.Entity<HistoryEvent>(e => e.HasIndex(x => new { x.Month, x.Day }));

        b.Entity<BlogCategory>(e => e.HasIndex(x => x.Slug).IsUnique());
        b.Entity<BlogPost>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasOne(x => x.Category).WithMany(c => c.Posts).HasForeignKey(x => x.CategoryId);
        });

        b.Entity<Comment>(e =>
        {
            e.HasIndex(x => new { x.TargetType, x.TargetId });
            e.HasOne(x => x.Parent).WithMany().HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Reaction>(e =>
        {
            // Bir cihaz aynı hedefe aynı türde tek tepki verebilir (toggle).
            e.HasIndex(x => new { x.TargetType, x.TargetId, x.Kind, x.DeviceKey }).IsUnique();
        });

        b.Entity<AppSetting>(e => e.HasKey(x => x.Key));
        b.Entity<AdminUser>(e => e.HasIndex(x => x.Email).IsUnique());
    }
}
