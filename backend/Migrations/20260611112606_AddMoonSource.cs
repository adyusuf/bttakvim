using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BTTakvim.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMoonSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MoonSource",
                table: "CalendarLeaves",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MoonSource",
                table: "CalendarLeaves");
        }
    }
}
